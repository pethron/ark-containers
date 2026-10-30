import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: dict[str, str]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_json(200, {"service": "ark-api", "status": "ok"})
            return
        self.send_json(404, {"error": "not found"})


if __name__ == "__main__":
    with ThreadingHTTPServer(("0.0.0.0", 8000), Handler) as server:
        print("ark-api listening on port 8000", flush=True)
        server.serve_forever()
