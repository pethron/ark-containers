import html
import json
import os
import socket
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen

PORT = int(os.environ.get("PORT", "8000"))
TIMEOUT_SECONDS = 2
MAX_FORM_BYTES = 2000


def api_url() -> str:
    return os.environ.get("API_URL", "").rstrip("/")


def site_title() -> str:
    return os.environ.get("SITE_TITLE", "Reading list")


def failure_kind(error: Exception) -> str:
    reason = error.reason if isinstance(error, URLError) else error
    if isinstance(reason, socket.gaierror):
        return "name_resolution"
    if isinstance(reason, (TimeoutError, socket.timeout)):
        return "timeout"
    return "connection"


def call_api(method: str, path: str, payload: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(api_url() + path, data=data, method=method)
    if data is not None:
        request.add_header("Content-Type", "application/json")
    try:
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        with error:
            try:
                return error.code, json.load(error)
            except ValueError:
                return error.code, {"error": "the API sent an unreadable answer"}


def render_page(links: list[dict], notice: str = "") -> bytes:
    title = html.escape(site_title())
    items = "\n".join(
        f'    <li><a href="{html.escape(link["url"])}">{html.escape(link["title"])}</a></li>'
        for link in links
    ) or "    <li>No links yet.</li>"
    notice_html = f"  <p><strong>{html.escape(notice)}</strong></p>\n" if notice else ""
    page = f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>{title}</title></head>
<body>
  <h1>{title}</h1>
{notice_html}  <ul>
{items}
  </ul>
  <form method="post" action="/add">
    <input name="url" placeholder="https://..." required>
    <input name="title" placeholder="Title">
    <button>Add</button>
  </form>
</body>
</html>
"""
    return page.encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    def send_body(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, status: int, payload: dict) -> None:
        self.send_body(status, json.dumps(payload).encode("utf-8"), "application/json; charset=utf-8")

    def send_failure(self, error: Exception) -> None:
        kind = failure_kind(error)
        print(f"API request failed: {kind}", file=sys.stderr, flush=True)
        status = 504 if kind == "timeout" else 502
        self.send_body(status, render_page([], f"The reading list is unavailable ({kind})."),
                       "text/html; charset=utf-8")

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/health":
            # Reports only this process; it does not contact the API.
            self.send_json(200, {"service": "reading-web", "status": "ok"})
            return
        if path != "/":
            self.send_json(404, {"error": "not found"})
            return
        try:
            status, payload = call_api("GET", "/links")
        except (URLError, TimeoutError, OSError) as error:
            self.send_failure(error)
            return
        if status != 200:
            print(f"API answered {status} to GET /links", file=sys.stderr, flush=True)
            self.send_body(502, render_page([], f"The API answered {status}."), "text/html; charset=utf-8")
            return
        self.send_body(200, render_page(payload.get("links", [])), "text/html; charset=utf-8")

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/add":
            self.send_json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_FORM_BYTES:
            self.send_json(413, {"error": f"a form can be at most {MAX_FORM_BYTES} bytes"})
            return
        form = parse_qs(self.rfile.read(length).decode("utf-8", errors="replace"))
        link = {"url": form.get("url", [""])[0], "title": form.get("title", [""])[0]}
        try:
            status, payload = call_api("POST", "/links", link)
        except (URLError, TimeoutError, OSError) as error:
            self.send_failure(error)
            return
        if status != 201:
            print(f"API answered {status} to POST /links", file=sys.stderr, flush=True)
            message = payload.get("error", f"the API answered {status}")
            self.send_body(502 if status >= 500 else 400, render_page([], f"Not saved: {message}."),
                           "text/html; charset=utf-8")
            return
        self.send_response(303)
        self.send_header("Location", "/")
        self.send_header("Content-Length", "0")
        self.end_headers()


if __name__ == "__main__":
    if not api_url():
        print("API_URL is not set: tell reading-web where the API listens, "
              "for example http://<name>:<port>", file=sys.stderr, flush=True)
        sys.exit(1)
    with ThreadingHTTPServer(("0.0.0.0", PORT), Handler) as server:
        print(f"reading-web listening on port {PORT}, using the API at {api_url()}", flush=True)
        server.serve_forever()
