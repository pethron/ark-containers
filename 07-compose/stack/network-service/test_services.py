import json
import os
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import patch

import api
import web


class NetworkServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.api_server = ThreadingHTTPServer(("127.0.0.1", 0), api.Handler)
        cls.api_thread = threading.Thread(target=cls.api_server.serve_forever, daemon=True)
        cls.api_thread.start()
        cls.web_server = ThreadingHTTPServer(("127.0.0.1", 0), web.Handler)
        cls.web_thread = threading.Thread(target=cls.web_server.serve_forever, daemon=True)
        cls.web_thread.start()
        cls.web_url = f"http://127.0.0.1:{cls.web_server.server_address[1]}"
        cls.api_url = f"http://127.0.0.1:{cls.api_server.server_address[1]}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.web_server.shutdown()
        cls.web_server.server_close()
        cls.api_server.shutdown()
        cls.api_server.server_close()

    def request(self, backend_url: str) -> tuple[int, dict]:
        with patch.dict(os.environ, {"BACKEND_URL": backend_url}):
            try:
                with urllib.request.urlopen(self.web_url, timeout=3) as response:
                    return response.status, json.load(response)
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, json.load(error)

    def test_default_backend_url_uses_service_name(self) -> None:
        with patch.dict(os.environ, clear=True):
            self.assertEqual(web.backend_url(), "http://ark-api:8000/health")

    def test_frontend_reaches_backend(self) -> None:
        self.assertEqual(self.request(f"{self.api_url}/health"), (200, {
            "service": "ark-web",
            "backend": {"service": "ark-api", "status": "ok"},
        }))

    def test_name_resolution_failure_is_visible(self) -> None:
        status, payload = self.request("http://missing-name.invalid:8000/health")
        self.assertEqual((status, payload["error"]), (502, "name_resolution"))

    def test_connection_failure_is_visible(self) -> None:
        status, payload = self.request("http://127.0.0.1:1/health")
        self.assertEqual((status, payload["error"]), (502, "connection"))

    def test_backend_http_failure_keeps_its_status(self) -> None:
        status, payload = self.request(f"{self.api_url}/missing")
        self.assertEqual((status, payload["backend_status"]), (404, 404))


if __name__ == "__main__":
    unittest.main()
