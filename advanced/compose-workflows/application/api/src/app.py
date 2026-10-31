"""Local reading-list API. Connections are per operation, never cached across restarts."""
import json
import logging
import os
import threading
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

import psycopg
import redis
from psycopg.rows import dict_row
from redis.backoff import NoBackoff
from redis.retry import Retry

GREETING = "Team reading list"
LOG = logging.getLogger("reading")


class DependencyUnavailable(Exception):
    pass


def connect_with_retry(connect, pause=time.sleep):
    for attempt in range(3):
        try:
            return connect()
        except psycopg.OperationalError:
            LOG.warning("database connection attempt %s/3 failed", attempt + 1)
            if attempt == 2:
                raise DependencyUnavailable("database unavailable") from None
            pause(0.25 * (attempt + 1))


def validate_title(value):
    if not isinstance(value, str) or not 1 <= len(value.strip()) <= 200:
        raise ValueError("title must contain 1 to 200 characters")
    return value.strip()


class Store:
    def __init__(self):
        self.password = Path(os.environ["DB_PASSWORD_FILE"]).read_text().strip()
        self.cache = (
            redis.Redis(host=os.environ["CACHE_HOST"], socket_connect_timeout=0.5,
                        socket_timeout=0.5, decode_responses=True,
                        retry=Retry(NoBackoff(), 0))
            if os.environ.get("CACHE_HOST") else None
        )
        self.counters = Counter()
        self.lock = threading.Lock()

    def count(self, name):
        with self.lock:
            self.counters[name] += 1
        LOG.info("cache event=%s", name)

    def connection(self):
        return connect_with_retry(lambda: psycopg.connect(
            host=os.environ.get("DB_HOST", "db"),
            dbname=os.environ.get("DB_NAME", "reading"),
            user=os.environ.get("DB_USER", "reading"),
            password=self.password, connect_timeout=2,
            options="-c statement_timeout=2000 -c lock_timeout=2000",
            row_factory=dict_row,
        ))

    def ready(self):
        with self.connection() as connection:
            connection.execute("SELECT revision FROM list_revision")

    def books(self):
        # The revision and rows share one snapshot; a concurrent writer cannot
        # populate a new revision's key with old rows.
        with self.connection() as connection:
            connection.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ")
            revision = connection.execute("SELECT revision FROM list_revision").fetchone()["revision"]
            self.count("revision_checks")
            key = f"books:{revision}"
            if self.cache:
                try:
                    cached = self.cache.get(key)
                    if cached is not None:
                        self.count("hits")
                        return json.loads(cached)
                    self.count("misses")
                except redis.RedisError:
                    self.count("cache_errors")
            rows = connection.execute("SELECT id, title FROM books ORDER BY id").fetchall()
            self.count("db_reads")
            if self.cache:
                try:
                    self.cache.setex(key, 30, json.dumps(rows))
                except redis.RedisError:
                    self.count("cache_errors")
            return rows

    def write(self, method, title=None, book_id=None):
        # Never replay a write after an uncertain commit. The caller sees an error.
        with self.connection() as connection:
            old = connection.execute(
                "UPDATE list_revision SET revision = revision + 1 RETURNING revision - 1 AS old"
            ).fetchone()["old"]
            if method == "POST":
                row = connection.execute(
                    "INSERT INTO books (title) VALUES (%s) RETURNING id, title", (title,)
                ).fetchone()
            elif method == "PUT":
                row = connection.execute(
                    "UPDATE books SET title = %s WHERE id = %s RETURNING id, title", (title, book_id)
                ).fetchone()
            else:
                row = connection.execute(
                    "DELETE FROM books WHERE id = %s RETURNING id, title", (book_id,)
                ).fetchone()
        if self.cache:
            try:
                self.cache.delete(f"books:{old}")
                self.count("invalidations")
            except redis.RedisError:
                self.count("cache_errors")
        return row

    def stats(self):
        with self.lock:
            return {key: self.counters[key] for key in (
                "hits", "misses", "db_reads", "revision_checks", "invalidations", "cache_errors"
            )}


class Handler(BaseHTTPRequestHandler):
    store = None

    def send_json(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def handle_request(self):
        path = urlsplit(self.path).path
        try:
            if self.command == "GET" and path == "/ready":
                self.store.ready()
                return self.send_json(200, {"ready": True})
            if self.command == "GET" and path == "/info":
                return self.send_json(200, {"greeting": GREETING})
            if self.command == "GET" and path == "/stats":
                return self.send_json(200, self.store.stats())
            if self.command == "GET" and path == "/books":
                return self.send_json(200, {"books": self.store.books()})
            book_id = None
            if path.startswith("/books/") and self.command in ("PUT", "DELETE"):
                book_id = int(path.removeprefix("/books/"))
            elif not (path == "/books" and self.command == "POST"):
                return self.send_json(404, {"error": "route not found"})
            title = None
            if self.command in ("POST", "PUT"):
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 4096:
                    raise ValueError("JSON body required (maximum 4096 bytes)")
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict):
                    raise ValueError("JSON object required")
                title = validate_title(body.get("title"))
            row = self.store.write(self.command, title, book_id)
            if row is None:
                return self.send_json(404, {"error": "book not found"})
            self.send_json(201 if self.command == "POST" else 200, {"book": row})
        except (ValueError, TypeError):
            self.send_json(400, {"error": "invalid request; supply a valid title and numeric id"})
        except (DependencyUnavailable, psycopg.Error):
            LOG.warning("request failed: database unavailable; write outcome may need checking")
            self.send_json(503, {"error": "database unavailable; retry reads, verify writes before repeating"})

    do_GET = handle_request
    do_POST = handle_request
    do_PUT = handle_request
    do_DELETE = handle_request


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    Handler.store = Store()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    server.timeout = 10
    server.serve_forever()
