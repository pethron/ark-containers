import json
import os
import socket
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

STARTER = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(STARTER / "api"), str(STARTER / "web")]

import api  # noqa: E402
import web  # noqa: E402


def serve(handler) -> tuple[ThreadingHTTPServer, str]:
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}"


def fetch(url: str, data: bytes | None = None, content_type: str = "application/json") -> tuple[int, str]:
    request = urllib.request.Request(url, data=data)
    if data is not None:
        request.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        with error:
            return error.code, error.read().decode("utf-8")


class ReadingListTests(unittest.TestCase):
    def setUp(self) -> None:
        self.data_dir = tempfile.TemporaryDirectory()
        links_file = os.path.join(self.data_dir.name, "links.jsonl")
        self.links_patch = patch.object(api, "LINKS_FILE", links_file)
        self.links_patch.start()
        self.api_server, self.api_url = serve(api.Handler)
        self.web_server, self.web_url = serve(web.Handler)

    def tearDown(self) -> None:
        for server in (self.web_server, self.api_server):
            server.shutdown()
            server.server_close()
        self.links_patch.stop()
        self.data_dir.cleanup()

    def test_api_saves_and_lists_links(self) -> None:
        body = json.dumps({"url": "https://example.org", "title": " Example  site "}).encode()
        status, payload = fetch(f"{self.api_url}/links", body)
        self.assertEqual(status, 201)
        self.assertEqual(json.loads(payload)["saved"]["title"], "Example site")
        status, payload = fetch(f"{self.api_url}/links")
        self.assertEqual(json.loads(payload), {"links": [{"url": "https://example.org", "title": "Example site"}]})

    def test_api_rejects_invalid_url(self) -> None:
        status, _ = fetch(f"{self.api_url}/links", json.dumps({"url": "ftp://x"}).encode())
        self.assertEqual(status, 400)

    def test_api_reports_unwritable_storage(self) -> None:
        with patch.object(api, "LINKS_FILE", os.path.join(self.data_dir.name, "missing", "links.jsonl")):
            status, _ = fetch(f"{self.api_url}/links", json.dumps({"url": "https://example.org"}).encode())
        self.assertEqual(status, 500)

    def test_web_lists_links_through_the_api(self) -> None:
        fetch(f"{self.api_url}/links", json.dumps({"url": "https://example.org", "title": "<b>x</b>"}).encode())
        with patch.dict(os.environ, {"API_URL": self.api_url, "SITE_TITLE": "Team links"}):
            status, page = fetch(self.web_url + "/")
        self.assertEqual(status, 200)
        self.assertIn("<h1>Team links</h1>", page)
        self.assertIn("&lt;b&gt;x&lt;/b&gt;", page)

    def test_web_form_adds_a_link(self) -> None:
        with patch.dict(os.environ, {"API_URL": self.api_url}):
            status, page = fetch(self.web_url + "/add", b"url=https%3A%2F%2Fexample.org&title=Example",
                                 "application/x-www-form-urlencoded")
        self.assertEqual(status, 200)
        self.assertIn(">Example</a>", page)

    def test_web_health_does_not_contact_the_api(self) -> None:
        with patch.dict(os.environ, {"API_URL": "http://missing-name.invalid:8000"}):
            status, payload = fetch(self.web_url + "/health")
        self.assertEqual((status, json.loads(payload)["status"]), (200, "ok"))

    def test_web_reports_name_resolution_failure(self) -> None:
        with patch.dict(os.environ, {"API_URL": "http://missing-name.invalid:8000"}):
            status, page = fetch(self.web_url + "/")
        self.assertEqual(status, 502)
        self.assertIn("name_resolution", page)

    def test_web_reports_connection_failure(self) -> None:
        # Windows retries a refused connection for about two seconds before failing.
        with patch.dict(os.environ, {"API_URL": "http://127.0.0.1:1"}), patch.object(web, "TIMEOUT_SECONDS", 8):
            status, page = fetch(self.web_url + "/")
        self.assertEqual(status, 502)
        self.assertIn("(connection)", page)

    def test_web_reports_timeout(self) -> None:
        silent = socket.socket()
        silent.bind(("127.0.0.1", 0))
        silent.listen()
        try:
            with patch.dict(os.environ, {"API_URL": f"http://127.0.0.1:{silent.getsockname()[1]}"}), \
                    patch.object(web, "TIMEOUT_SECONDS", 0.5):
                status, page = fetch(self.web_url + "/")
        finally:
            silent.close()
        self.assertEqual(status, 504)
        self.assertIn("timeout", page)


if __name__ == "__main__":
    unittest.main()
