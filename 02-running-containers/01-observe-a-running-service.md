---
title: "Observe a running service"
track: runbook
---

# Observe a running service

The service worked yesterday. Today a colleague asks whether it is running,
what message it serves and how to stop it. Let's turn the first experiment
into a small operating procedure.

We'll use the same HTTP service with a supplied shutdown wrapper. You don't
need to write Python. The wrapper lets the application tell us when it has
finished shutting down.

## Start from a known result

Run this module from the **course checkout root**, using Bash or PowerShell 7
and Linux containers. Prefix Docker commands with `sudo` on Linux Engine if
your setup requires it.

Check `docker ps -a` before starting: `ark-ops` must not belong to another
exercise, and loopback port 8082 must be free.

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-ops \
      --mount "type=bind,source=$(pwd),target=/course,readonly" \
      -e MESSAGE="Ready for the next shift" \
      -p 127.0.0.1:8082:8000 \
      python:3.12-alpine python /course/02-running-containers/service/operations.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-ops `
      --mount "type=bind,source=$($PWD.Path),target=/course,readonly" `
      -e MESSAGE="Ready for the next shift" `
      -p 127.0.0.1:8082:8000 `
      python:3.12-alpine python /course/02-running-containers/service/operations.py
    ```

The mount makes this course directory available read-only at `/course`.
The supplied wrapper finds the original application there. This is still a
local learning setup using the image's default user, not a production image.
Only mount the course checkout, not a directory containing private files.

Open `http://127.0.0.1:8082/` and `http://127.0.0.1:8082/health`.
Expect your message and `{"status": "ok"}`. If startup is still in progress,
wait a moment and retry; if it keeps failing, use the checks below.
With a remote engine, check from that host or use a tunnel.

## Is it running?

```text
docker ps -a
```

Find `ark-ops`. `Up` means its main process is running; `Exited` means it
stopped. Neither says whether a browser can get the intended response.
You already saw that distinction with the wrong port in module 01.

## What did the application report?

```text
docker logs ark-ops
```

Look for `ARK operations service listening on port 8000; mode=graceful`,
followed by your requests. These are messages written by the application,
not a health assessment made by Docker. If startup failed, read the error
before changing the launch command.

## How much is it using?

```text
docker stats --no-stream ark-ops
```

This shows a snapshot of CPU and memory usage. It doesn't impose a budget or
prove that usage was always this low. We'll introduce limits when we need them.

## Stop it and check what happened

```text
docker stop ark-ops
```

Then read its final messages:

```text
docker logs ark-ops
```

Expect a shutdown request and `clean shutdown complete`. The wrapper handles
Docker's stop request before ending the process. That is useful evidence of
this example's behavior, not a promise that every production request has been
saved safely.

Keep the stopped container for the next chapter. If finishing here, remove
only `ark-ops` with `docker rm ark-ops`.

??? note "More inspection tools, when you need them"

    `docker inspect ark-ops` shows detailed configuration and engine state.
    `docker top ark-ops` lists processes while it is running.
    `docker exec ark-ops python --version` starts an extra process inside a
    running container; it doesn't restart the server or replace its settings.

    To follow lifecycle changes, run `docker events --filter container=ark-ops`
    in another terminal. End that observer with Ctrl+C when finished.
    These tools answer different questions; you don't need to run all of them
    for every check.

Next, [lifecycle and writable state](02-container-lifecycle-and-states.md)
explain what stopping preserved.
