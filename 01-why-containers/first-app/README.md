# ARK message service

This is the application from [your first container exercise](../03-your-first-application.md):
a small HTTP service that returns a message and the hostname of the container
serving it. Use the chapter for the walkthrough, or the commands below to run it again.

From this directory, run the service. On Linux Engine, prefix
Docker commands with `sudo` if your setup requires it; Docker Desktop does not
need it. Run the commands in order and check errors before continuing.

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-message \
      --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
      -p 127.0.0.1:8080:8000 \
      python:3.12-alpine python /app/app.py
    curl http://127.0.0.1:8080/
    curl http://127.0.0.1:8080/health
    docker logs ark-message
    docker stop ark-message
    docker rm ark-message
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-message `
      --mount "type=bind,source=$($PWD.Path)\app.py,target=/app/app.py,readonly" `
      -p 127.0.0.1:8080:8000 `
      python:3.12-alpine python /app/app.py
    curl.exe http://127.0.0.1:8080/
    curl.exe http://127.0.0.1:8080/health
    docker logs ark-message
    docker stop ark-message
    docker rm ark-message
    ```

The chapter explains mounted paths, startup checks,
troubleshooting, experiments, and reset instructions. If a request arrives
before startup finishes, wait a moment and repeat it.

## What is supplied

- [app.py](app.py): a Python standard-library HTTP service, with no package dependencies.

The application returns JSON at `/`, `{"status": "ok"}` at `/health`, and an HTTP
404 with a JSON error for unknown routes. Requests are logged by Python's HTTP
handler; the startup message identifies the application's listening port.

## What this example leaves out

This is a local learning service, not a production HTTP server. Its process runs
as the image's default user (root), and its host port is bound to loopback.
It has no authentication, TLS, durable data, or production request handling.

Python is already installed in the downloaded image, not required on your laptop.
We mount the supplied source file read-only into that image so the first task
does not require writing a Dockerfile. **This is not yet a self-contained
application image:** anyone running this configuration needs `app.py` beside it.
Module 04 will address packaging code into an image; module 05 will revisit
mounted files.

The image tag selects a Python release line but can move. Module 03 explains
digests and how to identify exact image content.
