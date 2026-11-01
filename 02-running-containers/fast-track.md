---
title: "Fast track: operate a container"
track: runbook
---

# Fast track: operate a container

Someone wants the status page stopped tonight and updated tomorrow. We'll
inspect a running service, keep a note through a restart, then replace the
container with a new message.

Use Docker with Linux containers from [Before you start](../web/before-you-start.md)
and a browser or curl. The course image is downloaded on first use; no
course files are needed. On Linux Engine, prefix Docker commands with `sudo`
if required by your setup. Check `docker ps -a`: `ark-ft-ops` and loopback
port 8080 must be free. Choose another name or host port if needed and use it
throughout; leave unrelated containers alone.

## Inspect and restart

Start the service and look at the process from inside the container and
through Docker. Then write a small note in its `/tmp` directory:

```text
docker run -d --name ark-ft-ops -e MESSAGE="First shift" -p 127.0.0.1:8080:8000 ghcr.io/pethron/ark-message:1
docker ps -a --filter name=ark-ft-ops
docker logs ark-ft-ops
docker exec ark-ft-ops ps
docker top ark-ft-ops
docker exec ark-ft-ops sh -c 'echo shift-note > /tmp/shift-note'
docker stop ark-ft-ops
docker start ark-ft-ops
docker exec ark-ft-ops cat /tmp/shift-note
docker restart ark-ft-ops
```

`docker exec` runs a command in the running container. `stop`, `start` and
`restart` keep that same container and its settings.

!!! success "Checkpoint"

    The note still says `shift-note` after stop and start. Once the service
    restarts, `http://127.0.0.1:8080/` still returns `First shift`.

## Replace the configuration

To supply a different message, remove the old instance and create another.
This launch also requests a 128 MiB memory limit and a CPU budget of half
a CPU for the replacement:

```text
docker stop ark-ft-ops
docker rm ark-ft-ops
docker run -d --name ark-ft-ops --memory=128m --cpus=0.5 -e MESSAGE="Next shift" -p 127.0.0.1:8080:8000 ghcr.io/pethron/ark-message:1
docker inspect --format 'memory={{.HostConfig.Memory}} nano_cpus={{.HostConfig.NanoCpus}}' ark-ft-ops
docker exec ark-ft-ops ls /tmp
```

The inspection should show `134217728` and `500000000`, the values requested
from Docker. It doesn't by itself prove the host enforced them. If your
engine reports that either resource control is unsupported, stop and remove
the replacement if it was created, then repeat the launch without those two
options. Note that the limits weren't applied.

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

    The replacement answers `Next shift` and `ok`. `shift-note` is absent:
    reusing a name did not bring the old container's file along.

## Finish

```text
docker stop ark-ft-ops
docker rm ark-ft-ops
```

The image stays on the engine. Follow the
[guided lifecycle](01-pick-up-the-service.md) for the reasoning and more
checks, or try the [service-change kata](katas/README.md).
