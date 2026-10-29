---
title: "Pick up the service"
track: runbook
---

# Pick up the service

Getting a service to answer once is a good start, but the work doesn't end
when the page loads. Someone will eventually want a different message, ask
what is running inside it, or stop it and expect to bring it back tomorrow.
We'll take the application you already know through those changes, so you
can predict what each operation will keep and what it will replace.

Before launching anything, recall the three checks from module 01: how would
you find the container, read what the application reported, and check the
response a user actually receives? We'll use those checks throughout this
module, rather than introduce a new tool for every question.

## Start from a known result

We'll use the exact same [application](../01-why-containers/first-app/README.md)
as module 01, without adding another Python program or changing its behavior.
Open a terminal in **`01-why-containers/first-app`**, the directory containing
`app.py`, just as you did for the first launch. Docker must be running Linux
containers; use PowerShell 7 on Windows and prefix Docker commands with `sudo`
if your Linux Engine setup requires it.

Check `docker ps -a` before starting: the name `ark-ops` and local port 8082
must be free. If that name belongs to an earlier exercise, inspect it before
deciding whether to remove it.

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-ops \
      --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
      -e MESSAGE="Ready for the next shift" \
      -p 127.0.0.1:8082:8000 \
      python:3.12-alpine python /app/app.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-ops `
      --mount "type=bind,source=$($PWD.Path)\app.py,target=/app/app.py,readonly" `
      -e MESSAGE="Ready for the next shift" `
      -p 127.0.0.1:8082:8000 `
      python:3.12-alpine python /app/app.py
    ```

Only the container name, message and host port differ from the first launch.
The same `app.py` on your computer appears at `/app/app.py` inside the container,
read-only; we don't mount the whole repository. This is still a local learning
setup using the image's default user, and in module 04 we'll package the
application in its own image instead.

## Check it before changing it

Open `http://127.0.0.1:8082/`. The message should be
`Ready for the next shift`; `/health` should return `{"status": "ok"}`.
Then use your two terminal checks:

```text
docker ps -a
docker logs ark-ops
```

You should find `ark-ops` running, with a listening message and the requests
you just made in its logs. If the page fails immediately after launch, give
startup a moment and retry. A persistent failure is a reason to read those
logs and check the port mapping, not to keep launching more copies.

The launch publishes on the Docker host's loopback interface. With a remote
engine, open the page from that host or use a tunnel.

With that result checked, leave the service running: next we'll
[open a shell alongside it](02-inside-the-running-container.md) and find
out which process keeps the container alive. If you are finishing here
instead, stop and remove only your `ark-ops`.
