import json
import os
import socket
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

NOTES_FILE = os.environ.get("NOTES_FILE", "/data/notes.txt")
MAX_NOTE_BYTES = 1000
notes_lock = threading.Lock()


def read_notes() -> list[str]:
    try:
        with open(NOTES_FILE, encoding="utf-8") as notes:
            return [line.rstrip("\n") for line in notes if line.strip()]
    except FileNotFoundError:
        return []


def add_note(text: str) -> int:
    with notes_lock:
        with open(NOTES_FILE, "a", encoding="utf-8") as notes:
            notes.write(text + "\n")
        return len(read_notes())


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
        if path == "/":
            self.send_json(200, {
                "message": os.environ.get("MESSAGE", "Hello from ARK"),
                "served_by": socket.gethostname(),
            })
        elif path == "/health":
            self.send_json(200, {"status": "ok"})
        elif path == "/notes":
            self.send_json(200, {"notes": read_notes()})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/notes":
            self.send_json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_NOTE_BYTES:
            self.send_json(413, {"error": f"a note can be at most {MAX_NOTE_BYTES} bytes"})
            return
        raw = self.rfile.read(length).decode("utf-8", errors="replace")
        text = " ".join(raw.split())
        if not text:
            self.send_json(400, {"error": "send the note text as the request body"})
            return
        try:
            count = add_note(text)
        except OSError as error:
            print(f"Cannot save note to {NOTES_FILE}: {error.strerror}", file=sys.stderr, flush=True)
            self.send_json(500, {"error": "the note could not be saved"})
            return
        self.send_json(201, {"saved": text, "notes": count})


def check_notes_file() -> None:
    # Check permissions without creating the file, so a fresh container has no changes yet.
    if os.path.exists(NOTES_FILE):
        writable = os.access(NOTES_FILE, os.W_OK)
    else:
        directory = os.path.dirname(NOTES_FILE) or "."
        writable = os.path.isdir(directory) and os.access(directory, os.W_OK | os.X_OK)
    if not writable:
        print(f"Cannot write notes file {NOTES_FILE}: Permission denied", file=sys.stderr, flush=True)
        sys.exit(1)


if __name__ == "__main__":
    check_notes_file()
    with ThreadingHTTPServer(("0.0.0.0", 8000), Handler) as server:
        print(f"ARK notes service listening on port 8000, saving notes to {NOTES_FILE}", flush=True)
        server.serve_forever()
