import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from app import DependencyUnavailable, Handler, Store, connect_with_retry, validate_title
import psycopg


class ApiUnitTests(unittest.TestCase):
    def test_title_normalization(self):
        self.assertEqual(validate_title("  Docker café  "), "Docker café")

    def test_title_rejects_invalid_values(self):
        for value in (None, 1, "", "  ", "x" * 201):
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_title(value)

    def test_retries_connection_then_recovers(self):
        connection = object()
        connect = Mock(side_effect=[psycopg.OperationalError(), connection])
        pause = Mock()
        self.assertIs(connect_with_retry(connect, pause), connection)
        self.assertEqual(connect.call_count, 2)
        pause.assert_called_once_with(0.25)

    def test_connection_failure_is_bounded(self):
        connect = Mock(side_effect=psycopg.OperationalError())
        pause = Mock()
        with self.assertRaises(DependencyUnavailable):
            connect_with_retry(connect, pause)
        self.assertEqual(connect.call_count, 3)
        self.assertEqual(pause.call_count, 2)

    def handler(self, method, path, body=None):
        handler = Handler.__new__(Handler)
        data = json.dumps(body).encode() if body is not None else b""
        handler.command = method
        handler.path = path
        handler.headers = {"Content-Length": str(len(data))}
        handler.rfile = io.BytesIO(data)
        handler.send_json = Mock()
        handler.store = Mock()
        return handler

    def test_create_normalizes_title(self):
        handler = self.handler("POST", "/books", {"title": "  A book  "})
        handler.store.write.return_value = {"id": 1, "title": "A book"}
        handler.handle_request()
        handler.store.write.assert_called_once_with("POST", "A book", None)
        handler.send_json.assert_called_once_with(201, {"book": {"id": 1, "title": "A book"}})

    def test_invalid_request_does_not_write(self):
        for body in ({"title": ""}, [], None):
            handler = self.handler("POST", "/books", body)
            handler.handle_request()
            self.assertEqual(handler.send_json.call_args.args[0], 400)
            handler.store.write.assert_not_called()

    def test_database_failure_is_explicit(self):
        handler = self.handler("GET", "/books")
        handler.store.books.side_effect = DependencyUnavailable()
        handler.handle_request()
        self.assertEqual(handler.send_json.call_args.args[0], 503)
        self.assertIn("database unavailable", handler.send_json.call_args.args[1]["error"])

    def test_missing_route_is_api_404(self):
        handler = self.handler("GET", "/api/books")
        handler.handle_request()
        handler.send_json.assert_called_once_with(404, {"error": "route not found"})

    def test_cached_read_checks_revision_before_key(self):
        store = Store.__new__(Store)
        store.count = Mock()
        connection = Mock()
        context = Mock()
        context.__enter__ = Mock(return_value=connection)
        context.__exit__ = Mock(return_value=False)
        store.connection = Mock(return_value=context)
        connection.execute.return_value.fetchone.return_value = {"revision": 9}
        store.cache = Mock()
        store.cache.get.return_value = '[{"id": 1, "title": "Fresh revision"}]'
        self.assertEqual(store.books()[0]["title"], "Fresh revision")
        store.cache.get.assert_called_once_with("books:9")
        store.count.assert_any_call("revision_checks")
        store.count.assert_any_call("hits")
        self.assertEqual(connection.execute.call_count, 2)


if __name__ == "__main__":
    unittest.main()
