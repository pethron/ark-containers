# ARK message service for module 03

This is the small HTTP service we hand over in
[Images and registries](../README.md). It returns a message and the hostname of
the container serving it, so you can tell which instance answered. The file is
an identical copy of the module 01 application, kept here so that this module
can be started on its own.

Run the commands from this directory. On Linux Engine, prefix Docker commands
with `sudo` if your setup requires it; Docker Desktop does not need it.
The name `ark-image-service` and local port 8080 must be free.

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-image-service \
      --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
      -e MESSAGE="Ready for the handover" \
      -p 127.0.0.1:8080:8000 \
      python:3.12-alpine python /app/app.py
    curl http://127.0.0.1:8080/
    curl http://127.0.0.1:8080/health
    docker logs ark-image-service
    docker stop ark-image-service
    docker rm ark-image-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-image-service `
      --mount "type=bind,source=$($PWD.Path)\app.py,target=/app/app.py,readonly" `
      -e MESSAGE="Ready for the handover" `
      -p 127.0.0.1:8080:8000 `
      python:3.12-alpine python /app/app.py
    curl.exe http://127.0.0.1:8080/
    curl.exe http://127.0.0.1:8080/health
    docker logs ark-image-service
    docker stop ark-image-service
    docker rm ark-image-service
    ```

If a request arrives before startup finishes, wait a moment and repeat it.
Stopping can take around ten seconds, because the application has no custom
shutdown handling.

## What is supplied

- [app.py](app.py): a Python standard-library HTTP service, with no package dependencies.

The application returns JSON at `/`, `{"status": "ok"}` at `/health`, and an HTTP
404 with a JSON error for unknown routes. It reads its message from the
`MESSAGE` environment variable when it starts and logs each request.

## What this example leaves out

This is a local learning service, not a production HTTP server. Its process runs
as the image's default user (root), its host port is bound to loopback, and it
has no custom shutdown handling. Python comes from the image while `app.py` is
mounted read-only from this directory, so an image archive alone can't run it:
anyone receiving the handover also needs this file beside the command.
Module 04 packages the code into an image.
