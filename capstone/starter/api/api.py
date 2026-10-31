import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

LINKS_FILE = os.environ.get("LINKS_FILE", "/data/links.jsonl")
PORT = int(os.environ.get("PORT", "8000"))
MAX_BODY_BYTES = 2000
links_lock = threading.Lock()


def read_links() -> list[dict]:
    try:
        with open(LINKS_FILE, encoding="utf-8") as links:
            return [json.loads(line) for line in links if line.strip()]
    except FileNotFoundError:
        return []


def add_link(url: str, title: str) -> int:
    with links_lock:
        with open(LINKS_FILE, "a", encoding="utf-8") as links:
            links.write(json.dumps({"url": url, "title": title}) + "\n")
        return len(read_links())


def parse_link(raw: bytes) -> tuple[str, str]:
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("send a JSON object")
    url = str(data.get("url", "")).strip()
    title = " ".join(str(data.get("title", "")).split()) or url
    if not url.startswith(("http://", "https://")):
        raise ValueError("url must start with http:// or https://")
    return url, title


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/health":
            self.send_json(200, {"service": "reading-api", "status": "ok"})
        elif path == "/links":
            try:
                links = read_links()
            except (OSError, ValueError) as error:
                print(f"Cannot read links from {LINKS_FILE}: {error}", file=sys.stderr, flush=True)
                self.send_json(500, {"error": "the links could not be read"})
                return
            self.send_json(200, {"links": links})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/links":
            self.send_json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY_BYTES:
            self.send_json(413, {"error": f"a request can be at most {MAX_BODY_BYTES} bytes"})
            return
        try:
            url, title = parse_link(self.rfile.read(length))
        except (ValueError, UnicodeDecodeError) as error:
            self.send_json(400, {"error": str(error)})
            return
        try:
            count = add_link(url, title)
        except OSError as error:
            print(f"Cannot save link to {LINKS_FILE}: {error.strerror}", file=sys.stderr, flush=True)
            self.send_json(500, {"error": "the link could not be saved"})
            return
        self.send_json(201, {"saved": {"url": url, "title": title}, "links": count})


def check_links_file() -> None:
    # Check permissions without creating the file, so a fresh container has no changes yet.
    if os.path.exists(LINKS_FILE):
        writable = os.access(LINKS_FILE, os.W_OK)
    else:
        directory = os.path.dirname(LINKS_FILE) or "."
        writable = os.path.isdir(directory) and os.access(directory, os.W_OK | os.X_OK)
    if not writable:
        print(f"Cannot write links file {LINKS_FILE}: Permission denied", file=sys.stderr, flush=True)
        sys.exit(1)


if __name__ == "__main__":
    check_links_file()
    with ThreadingHTTPServer(("0.0.0.0", PORT), Handler) as server:
        print(f"reading-api listening on port {PORT}, saving links to {LINKS_FILE}", flush=True)
        server.serve_forever()
