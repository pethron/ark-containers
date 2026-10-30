import signal
from http.server import ThreadingHTTPServer
from types import FrameType

from app import Handler


def stop(number: int, frame: FrameType | None) -> None:
    print(f"ARK signal service: received signal {number}; closing listener", flush=True)
    raise SystemExit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    with ThreadingHTTPServer(("0.0.0.0", 8000), Handler) as server:
        print("ARK signal service listening on port 8000", flush=True)
        server.serve_forever()
