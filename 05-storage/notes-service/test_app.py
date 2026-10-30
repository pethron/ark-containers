import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import patch

import app


class NotesServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.directory = tempfile.TemporaryDirectory()
        notes_file = os.path.join(self.directory.name, "notes.txt")
        self.patcher = patch.object(app, "NOTES_FILE", notes_file)
        self.patcher.start()
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_address[1]}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.patcher.stop()
        self.directory.cleanup()

    def request(self, path: str, body: bytes | None = None) -> tuple[int, dict]:
        request = urllib.request.Request(self.base + path, data=body)
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            with error:
                return error.code, json.load(error)

    def test_message_and_health_are_unchanged(self) -> None:
        self.assertEqual(self.request("/health"), (200, {"status": "ok"}))
        status, payload = self.request("/")
        self.assertEqual(status, 200)
        self.assertIn("served_by", payload)

    def test_notes_start_empty_and_are_kept_in_order(self) -> None:
        self.assertEqual(self.request("/notes"), (200, {"notes": []}))
        self.assertEqual(self.request("/notes", b"first note")[0], 201)
        status, payload = self.request("/notes", b"  second\n note ")
        self.assertEqual((status, payload), (201, {"saved": "second note", "notes": 2}))
        self.assertEqual(self.request("/notes"), (200, {"notes": ["first note", "second note"]}))

    def test_empty_and_oversized_notes_are_rejected(self) -> None:
        self.assertEqual(self.request("/notes", b"   ")[0], 400)
        self.assertEqual(self.request("/notes", b"x" * (app.MAX_NOTE_BYTES + 1))[0], 413)
        self.assertEqual(self.request("/notes"), (200, {"notes": []}))

    def test_startup_check_does_not_create_the_file(self) -> None:
        app.check_notes_file()
        self.assertFalse(os.path.exists(app.NOTES_FILE))

    def test_unwritable_location_stops_startup(self) -> None:
        missing = os.path.join(self.directory.name, "missing", "notes.txt")
        with patch.object(app, "NOTES_FILE", missing), self.assertRaises(SystemExit) as stopped:
            app.check_notes_file()
        self.assertEqual(stopped.exception.code, 1)


if __name__ == "__main__":
    unittest.main()
