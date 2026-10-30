import os
import unittest
from unittest.mock import patch

import serve


class MessageTests(unittest.TestCase):
    def check_message(self, environment: dict[str, str], expected: str) -> None:
        with patch.dict(os.environ, environment, clear=True):
            with patch("serve.runpy.run_module") as run:
                serve.main()
                self.assertEqual(os.environ["MESSAGE"], expected)
                run.assert_called_once_with("app", run_name="__main__")

    def test_default(self) -> None:
        self.check_message({}, "Hello from ARK")

    def test_audience(self) -> None:
        self.check_message({"AUDIENCE": "the release team"}, "Hello the release team")

    def test_explicit_message_wins(self) -> None:
        self.check_message({"AUDIENCE": "team", "MESSAGE": "Ready"}, "Ready")


if __name__ == "__main__":
    unittest.main()
