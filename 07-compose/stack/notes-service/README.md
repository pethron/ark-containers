# Notes service

This is the service you add to the stack in the module's
[kata](../../katas/README.md): a small web service that saves notes to a
file, so the stack has some data worth keeping.

- [app.py](app.py): an HTTP service using only the Python standard library.
  It listens on port 8000; `GET /health` reports its status, `POST /notes`
  saves the request body as a note and `GET /notes` lists them. Notes go to
  `/data/notes.txt`, one per line, or to the file named by `NOTES_FILE`. At
  startup the service checks that it can write there and exits with an error
  in its log if it can't.
- [Dockerfile](Dockerfile): builds the image with a `/data` directory owned
  by the `ark` application user. The code stays root-owned and read-only for
  `ark`.
- `test_app.py` contains unit tests for the HTTP and notes behavior; the
  Docker build context excludes it.

A note is at most 1,000 bytes, and line breaks inside it become spaces.
There's no editing, deletion, authentication or TLS, so publish the port on
loopback only. The plain-text file isn't a database; a service with real
concurrent writers would need one along with its own backup procedure.
