# Packaged message service

This is the example from
[Package the service in an image](../01-package-the-service-in-an-image.md):
the course's message service with a Dockerfile that copies its code into
an image and runs it as an application user. Use the chapter for the
walkthrough, or the commands below to build and run it again.

From this directory, build the image and start the service. On Linux Engine,
prefix Docker commands with `sudo` if your setup requires it. The build needs
a network connection to look up the Python base image.

```text
docker build -t ark-message:first-build .
```

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-built \
      -e MESSAGE="Packaged with its code" \
      -p 127.0.0.1:8080:8000 \
      ark-message:first-build
    curl http://127.0.0.1:8080/
    curl http://127.0.0.1:8080/health
    docker logs ark-built
    docker stop ark-built
    docker rm ark-built
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-built `
      -e MESSAGE="Packaged with its code" `
      -p 127.0.0.1:8080:8000 `
      ark-message:first-build
    curl.exe http://127.0.0.1:8080/
    curl.exe http://127.0.0.1:8080/health
    docker logs ark-built
    docker stop ark-built
    docker rm ark-built
    ```

If a request arrives before startup finishes, wait a moment and repeat it.
The image stays available after cleanup; remove it with
`docker image rm ark-message:first-build` when you no longer need it.

## What is supplied

- [app.py](app.py): the course's message service, an identical copy of the
  one first launched in module 01. It uses only the Python standard library,
  answers on port 8000 inside the container, returns its message as JSON on
  `/` and `{"status": "ok"}` on `/health`, and reads `MESSAGE` to replace its
  default `Hello from ARK`.
- [Dockerfile](Dockerfile): starts from `python:3.12-alpine`, adds an `ark`
  account, copies `app.py` to `/app/app.py` as a root-owned file readable by
  everyone, and records `ark` as the default user and `python /app/app.py`
  as the default command.
- [Dockerfile.exec](Dockerfile.exec), [Dockerfile.shell](Dockerfile.shell)
  and [signal-server.py](signal-server.py): direct and shell-wrapped launches
  for the [signal experiment](../04-commands-and-signals.md). The supplied
  server reuses the original HTTP handler and logs TERM before exiting.
- [Dockerfile.secret](Dockerfile.secret): a later Security exercise uses this
  recipe to demonstrate a temporary build-secret mount.

The `.dockerignore` keeps dummy `*.secret` files, `.env`, bytecode and archives
out of the ordinary build context. These additional recipes don't change the
initial Dockerfile: choose them explicitly with `-f` in their linked chapters.

## What this example leaves out

The image contains the code, so launching it needs no source file or mount.
The message and port remain launch settings. Its base image is selected by
a tag that can move, so building again later may start from a different
Python build; the following chapters look at caching and the build context.

This is still a local learning service: its port is bound to loopback, and
it has no authentication, TLS or durable data. Running as `ark` limits what the
process can change inside the container; module 08 covers further runtime
hardening.
