import json
import os
import socket
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from threading import Thread
from unittest.mock import patch

from app import Handler


class ApplicationTests(unittest.TestCase):
    server: ThreadingHTTPServer
    thread: Thread

    @classmethod
    def setUpClass(cls) -> None:
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def request(self, path: str) -> tuple[int, str, dict[str, str]]:
        connection = HTTPConnection(
            "127.0.0.1", self.server.server_port, timeout=5
        )
        try:
            connection.request("GET", path)
            response = connection.getresponse()
            body = response.read()
            self.assertEqual(int(response.getheader("Content-Length", "0")), len(body))
            return (
                response.status,
                response.getheader("Content-Type", ""),
                json.loads(body),
            )
        finally:
            connection.close()

    def test_default_message_and_host(self) -> None:
        with patch.dict(os.environ):
            os.environ.pop("MESSAGE", None)
            status, content_type, payload = self.request("/")
        self.assertEqual(status, 200)
        self.assertEqual(content_type, "application/json; charset=utf-8")
        self.assertEqual(
            payload, {"message": "Hello from ARK", "served_by": socket.gethostname()}
        )

    def test_configured_message(self) -> None:
        with patch.dict(os.environ, {"MESSAGE": "My first deployment"}):
            status, _, payload = self.request("/")
        self.assertEqual(status, 200)
        self.assertEqual(payload["message"], "My first deployment")

    def test_health(self) -> None:
        status, _, payload = self.request("/health")
        self.assertEqual((status, payload), (200, {"status": "ok"}))

    def test_unknown_route(self) -> None:
        status, _, payload = self.request("/missing")
        self.assertEqual((status, payload), (404, {"error": "not found"}))

    def test_query_does_not_change_route(self) -> None:
        status, _, payload = self.request("/health?source=lab")
        self.assertEqual((status, payload), (200, {"status": "ok"}))


if __name__ == "__main__":
    unittest.main()
