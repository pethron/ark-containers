import os
import runpy
import signal
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import FrameType

_application = runpy.run_path(
    str(Path(__file__).resolve().parents[2] / "01-why-containers" / "first-app" / "app.py")
)
Handler: type[BaseHTTPRequestHandler] = _application["Handler"]


def main() -> int:
    mode = os.environ.get("SHUTDOWN_MODE", "graceful")
    if mode not in {"graceful", "ignore"}:
        print(
            f"Invalid SHUTDOWN_MODE={mode!r}; choose graceful or ignore.",
            file=sys.stderr,
            flush=True,
        )
        return 23

    stopped = threading.Event()

    def handle_signal(number: int, frame: FrameType | None) -> None:
        if mode == "ignore":
            print(f"ARK fixture: ignoring signal {number}", flush=True)
        else:
            print(f"ARK fixture: shutdown requested by signal {number}", flush=True)
            stopped.set()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    with ThreadingHTTPServer(("0.0.0.0", 8000), Handler) as server:
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        print(f"ARK operations service listening on port 8000; mode={mode}", flush=True)
        stopped.wait()
        server.shutdown()
        worker.join()
    print("ARK fixture: clean shutdown complete", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
