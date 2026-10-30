import json
import os
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        status = 200
        if path == "/":
            payload = {
                "message": os.environ.get("MESSAGE", "Hello from ARK"),
                "served_by": socket.gethostname(),
            }
        elif path == "/health":
            payload = {"status": "ok"}
        else:
            status = 404
            payload = {"error": "not found"}

        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    with ThreadingHTTPServer(("0.0.0.0", 8000), Handler) as server:
        print("ARK message service listening on port 8000", flush=True)
        server.serve_forever()
