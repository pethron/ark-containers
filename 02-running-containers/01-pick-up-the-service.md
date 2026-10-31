---
title: "Checking a running service"
track: runbook
---

# Checking a running service

Getting a service to answer once is a good start, but the work doesn't end
when the page loads. Someone will eventually want a different message, ask
what is running inside it, or stop it and expect to bring it back tomorrow.
We'll take the application you already know through those changes, so you
can predict what each operation will keep and what it will replace.

Before launching anything, recall the three checks from module 01: how would
you find the container, read what the application reported, and check the
response a user actually receives? We'll use those checks throughout this
module, rather than introduce a new tool for every question.

We'll keep using the course's message service image from module 01. You need a
working Docker setup running Linux containers and a browser or `curl`; this
module doesn't use the course files. On Linux Engine, prefix Docker commands
with `sudo` if your setup requires it.

Check `docker ps -a` before starting: the name `ark-ops` and local port 8080
must be free. If that name belongs to an earlier exercise, inspect it before
deciding whether to remove it.

## Start from a known result

We'll start the service exactly as a colleague would, with the same image and a
message for the next shift. Only the line-continuation character differs
between the two shells:

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-ops \
      -e MESSAGE="Ready for the next shift" \
      -p 127.0.0.1:8080:8000 \
      ghcr.io/pethron/ark-message:1
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-ops `
      -e MESSAGE="Ready for the next shift" `
      -p 127.0.0.1:8080:8000 `
      ghcr.io/pethron/ark-message:1
    ```

The image supplies Python, the application and the command that starts it,
while the message and port configure this instance.

## Check it before changing it

Open `http://127.0.0.1:8080/`. The message should be
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

With that result checked, leave `ark-ops` running: next we'll
[open a shell alongside it](02-inside-the-running-container.md) and find
out which process keeps the container alive.
