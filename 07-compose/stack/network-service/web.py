import json
import os
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


def backend_url() -> str:
    return os.environ.get("BACKEND_URL", "http://ark-api:8000/health")


def connection_error_kind(error: URLError) -> str:
    if isinstance(error.reason, socket.gaierror):
        return "name_resolution"
    return "connection"


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_json(200, {"service": "ark-web", "status": "ok"})
            return
        if self.path != "/":
            self.send_json(404, {"error": "not found"})
            return

        try:
            with urlopen(backend_url(), timeout=2) as response:
                payload = json.load(response)
        except HTTPError as error:
            error.close()
            self.send_json(error.code, {
                "service": "ark-web",
                "error": "backend_http_error",
                "backend_status": error.code,
            })
        except URLError as error:
            kind = connection_error_kind(error)
            print(f"Backend request failed: {kind}", flush=True)
            self.send_json(502, {"service": "ark-web", "error": kind})
        else:
            self.send_json(200, {"service": "ark-web", "backend": payload})


if __name__ == "__main__":
    with ThreadingHTTPServer(("0.0.0.0", 8000), Handler) as server:
        print("ark-web listening on port 8000", flush=True)
        server.serve_forever()
