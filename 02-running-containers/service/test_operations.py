import contextlib
import io
import os
import signal
import unittest
from unittest.mock import patch

import operations


class OperationsTests(unittest.TestCase):
    def test_invalid_mode_exits_before_binding(self) -> None:
        output = io.StringIO()
        with (
            patch.dict(os.environ, {"SHUTDOWN_MODE": "gracefull"}),
            patch.object(operations, "ThreadingHTTPServer") as server,
            contextlib.redirect_stderr(output),
        ):
            self.assertEqual(operations.main(), 23)
            server.assert_not_called()
        self.assertIn("Invalid SHUTDOWN_MODE='gracefull'", output.getvalue())

    def test_term_requests_clean_shutdown(self) -> None:
        handlers = {}
        output = io.StringIO()
        with (
            patch.dict(os.environ, {"SHUTDOWN_MODE": "graceful"}),
            patch.object(operations.signal, "signal", side_effect=handlers.__setitem__),
            patch.object(operations, "ThreadingHTTPServer") as server_factory,
            contextlib.redirect_stdout(output),
        ):
            server = server_factory.return_value.__enter__.return_value
            server.serve_forever.side_effect = lambda: handlers[signal.SIGTERM](
                signal.SIGTERM, None
            )
            self.assertEqual(operations.main(), 0)
            server.shutdown.assert_called_once_with()
        self.assertIn("clean shutdown complete", output.getvalue())


if __name__ == "__main__":
    unittest.main()
