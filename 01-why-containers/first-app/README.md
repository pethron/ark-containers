# ARK message service

A small, complete HTTP service for the
[first application experience](../03-your-first-application.md). It returns a
configurable message and the hostname of the process serving it.

From this directory:

```bash
docker run -d --name ark-message \
  --user 65534:65534 \
  --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
  -p 127.0.0.1:8080:8000 \
  docker.io/library/python:3.12-alpine python -u /app/app.py
curl --fail http://127.0.0.1:8080/
curl --fail http://127.0.0.1:8080/health
docker logs ark-message
docker stop ark-message
docker rm ark-message
```

In the rootful Linux lab, prefix Docker commands with `sudo`. The chapter includes
startup checks, troubleshooting, experiments, and reset instructions.

## What is supplied

- [app.py](app.py): a Python standard-library HTTP service, with no package dependencies.
- [compose.yaml](compose.yaml): an equivalent declarative configuration, introduced after
  running, changing and diagnosing the application with `docker run`.
- [test_app.py](test_app.py): checks for the service's response, configuration, and error path.

The application returns JSON at `/`, `{"status": "ok"}` at `/health`, and an HTTP
404 with a JSON error for unknown routes. Requests are logged by Python's HTTP
handler; the startup message identifies the application's listening port.

## Deliberate shortcuts

This is a local learning service, not a production HTTP server. Its process runs
as an unprivileged user in the container, and its host port is bound to loopback.
It has no authentication, TLS, durable data, or production request handling.

We mount the supplied source file read-only into a prepared Python image so the
first task does not require writing a Dockerfile. **This is not yet a self-contained
application image:** anyone running this configuration needs `app.py` beside it.
Module 06 will address packaging code into an image; module 07 will revisit
mounted files.

The image tag selects a Python release line but can move. Module 05 explains
digests and how to identify exact image content.

## Maintainer check

No local Python installation is needed for the learner's Docker path. To test
the application separately from Docker, maintainers can run from this directory:

```bash
uv run --no-project python -m unittest -v test_app
```

These tests verify HTTP behavior on a temporary loopback port. They do not replace
the container exercises' checks for image downloads, mounts, and port publishing.
