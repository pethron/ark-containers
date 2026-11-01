---
title: "Fast track: run your first service"
track: runbook
---

# Fast track: run your first service

Your colleague needs a message page without installing Python. We'll start
one, change its message, fix a wrong port and run a second copy.

Use Docker with Linux containers and a browser or curl, as set up in
[Before you start](../web/before-you-start.md). No course files are needed.
On Linux Engine, prefix Docker commands with `sudo` if your setup requires it.
Check `docker ps -a`: the names `ark-ft-first` and `ark-ft-second` must be
free, as must loopback ports 8080 and 8081. If they aren't, choose unused
names or host ports and use them consistently below; don't remove other work.

## Start and check

Start the published course image in the background. The mapping sends
requests from port 8080 on the Docker host's loopback address to port 8000
inside the container:

```text
docker run -d --name ark-ft-first -p 127.0.0.1:8080:8000 ghcr.io/pethron/ark-message:1
docker ps -a --filter name=ark-ft-first
docker logs ark-ft-first
```

Docker downloads the image on its first use. Check the service itself:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/
    curl http://127.0.0.1:8080/health
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/
    curl.exe http://127.0.0.1:8080/health
    ```

!!! success "Checkpoint"

    The first response says `Hello from ARK`, `/health` says `ok`, and
    `docker ps` shows the container running. If a request arrives before
    startup, retry; if it still fails, read `docker logs ark-ft-first`.

## Change the message and fix a port

The message is a launch setting. Replace the first container to give it a
new value, then start a second copy with an intentionally wrong target port:

```text
docker stop ark-ft-first
docker rm ark-ft-first
docker run -d --name ark-ft-first -e MESSAGE="Ready for the next shift" -p 127.0.0.1:8080:8000 ghcr.io/pethron/ark-message:1
docker run -d --name ark-ft-second -e MESSAGE="Ready for review" -p 127.0.0.1:8081:8001 ghcr.io/pethron/ark-message:1
docker ps -a --filter name=ark-ft-second
docker port ark-ft-second
docker logs ark-ft-second
```

Try `http://127.0.0.1:8081/` in your browser: the request should fail.
The container can still be running; its log says the service listens on
8000, while `docker port` shows that we sent requests to 8001. Replace only
the second container with the correct target. If its log was empty just
after launch, run `docker logs ark-ft-second` again first:

```text
docker stop ark-ft-second
docker rm ark-ft-second
docker run -d --name ark-ft-second -e MESSAGE="Ready for review" -p 127.0.0.1:8081:8000 ghcr.io/pethron/ark-message:1
```

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/
    curl http://127.0.0.1:8081/
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/
    curl.exe http://127.0.0.1:8081/
    ```

!!! success "Checkpoint"

    Both addresses answer with their own message. The host ports differ,
    while both applications listen on port 8000 inside their containers.

## Finish

Stop and remove only the two containers you created. The downloaded image
stays available:

```text
docker stop ark-ft-first ark-ft-second
docker rm ark-ft-first ark-ft-second
```

For the guided path, start with
[the problem containers solve](01-the-problem-containers-solve.md). To try a
handover without the recipe, use the [kata](katas/README.md).