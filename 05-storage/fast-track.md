---
title: "Fast track: keep and restore data"
track: runbook
---

# Fast track: keep and restore data

The notes service must keep its data when its container is replaced, and
you need a backup you can actually restore. We'll use a named volume, then
test a copy in a second service.

You need the course checkout, Docker with Linux containers, `tar` and curl
from [Before you start](../web/before-you-start.md). On Linux Engine, prefix
Docker commands with `sudo` if required. Check `docker ps -a`,
`docker volume ls` and `docker image ls`: containers `ark-ft-notes` and
`ark-ft-restored`, volumes `ark-ft-data` and `ark-ft-restore`, image tag
`ark-ft-notes:1`, and loopback ports 8080 and 8081 must be free. Choose
unused alternatives and use them throughout; don't delete existing data.

## Keep a note through replacement

From the root of the checkout, enter the supplied notes-service directory:

=== "Linux (Bash)"

    ```bash
    cd 05-storage/notes-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\05-storage\notes-service
    ```

Build the image and attach a new volume at `/data`, where the service
stores its notes:

```text
docker build -t ark-ft-notes:1 .
docker volume create ark-ft-data
docker run -d --name ark-ft-notes -p 127.0.0.1:8080:8000 --mount type=volume,source=ark-ft-data,target=/data ark-ft-notes:1
docker inspect --format '{{.Name}} {{.State.Running}}' ark-ft-notes
docker port ark-ft-notes
```

!!! success "Checkpoint"

    The inspection shows `/ark-ft-notes true` and the port command maps
    `8000/tcp` to `127.0.0.1:8080`. If either check fails, resolve the launch
    error before sending a note to that address.

=== "Linux (Bash)"

    ```bash
    curl -d "Water the plants" http://127.0.0.1:8080/notes
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -d "Water the plants" http://127.0.0.1:8080/notes
    ```

The response should say `"saved": "Water the plants"`. If the service is
still starting, retry; if the note isn't saved, check `docker logs
ark-ft-notes` before continuing. Replace the container and attach the same
volume:

```text
docker stop ark-ft-notes
docker rm ark-ft-notes
docker run -d --name ark-ft-notes -p 127.0.0.1:8080:8000 --mount type=volume,source=ark-ft-data,target=/data ark-ft-notes:1
docker inspect --format '{{json .Mounts}}' ark-ft-notes
```

!!! success "Checkpoint"

    `http://127.0.0.1:8080/notes` still lists `Water the plants`; the
    inspection shows `ark-ft-data` mounted at `/data`.

## Try the other mounts

From the same notes-service directory, a read-only bind mount exposes your
source files to a one-off container:

=== "Linux (Bash)"

    ```bash
    docker run --rm --mount "type=bind,source=$(pwd),target=/app,readonly" ark-ft-notes:1 ls /app
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run --rm --mount "type=bind,source=$($PWD.Path),target=/app,readonly" ark-ft-notes:1 ls /app
    ```

The listing includes `app.py`. A `tmpfs` mount is for temporary files;
this one is limited to 1 MiB and disappears when its container ends:

```text
docker run --rm --mount type=tmpfs,target=/data,tmpfs-mode=1777,tmpfs-size=1m ark-ft-notes:1 sh -c 'echo scratch > /data/example && cat /data/example'
```

!!! success "Checkpoint"

    The command prints `scratch`. The named volume is still the choice for
    notes that must survive replacement.

## Back up and restore

Stop the service before copying its files. In your home directory, create
a **new** `ark-ft-backup` folder. If it already exists, choose another
folder and use it below so you don't overwrite someone else's backup:

```text
docker stop ark-ft-notes
cd "$HOME"
mkdir ark-ft-backup
cd ark-ft-backup
```

The short-lived helper reads the stopped service's volume and writes
`notes.tar` into this folder. It runs as root so it can preserve the
recorded file owners during restoration:

=== "Linux (Bash)"

    ```bash
    docker run --rm --mount type=volume,source=ark-ft-data,target=/data,readonly --mount "type=bind,source=$(pwd),target=/backup" python:3.12-alpine tar -C /data -cf /backup/notes.tar .
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run --rm --mount type=volume,source=ark-ft-data,target=/data,readonly --mount "type=bind,source=$($PWD.Path),target=/backup" python:3.12-alpine tar -C /data -cf /backup/notes.tar .
    ```

Check `tar -tf notes.tar` includes `./notes.txt` before continuing.
Restore into a separate new volume, leaving the original untouched:

```text
docker volume create ark-ft-restore
```

=== "Linux (Bash)"

    ```bash
    docker run --rm --mount type=volume,source=ark-ft-restore,target=/data --mount "type=bind,source=$(pwd),target=/backup,readonly" python:3.12-alpine tar -C /data -xf /backup/notes.tar
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run --rm --mount type=volume,source=ark-ft-restore,target=/data --mount "type=bind,source=$($PWD.Path),target=/backup,readonly" python:3.12-alpine tar -C /data -xf /backup/notes.tar
    ```

```text
docker start ark-ft-notes
docker run -d --name ark-ft-restored -p 127.0.0.1:8081:8000 --mount type=volume,source=ark-ft-restore,target=/data ark-ft-notes:1
docker inspect --format '{{.Name}} {{.State.Running}}' ark-ft-notes ark-ft-restored
docker port ark-ft-notes
docker port ark-ft-restored
```

!!! success "Checkpoint"

    Both named containers are running. Their port mappings point to
    `127.0.0.1:8080` and `127.0.0.1:8081` respectively; if they don't,
    resolve the launch error before sending another note.

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8081/notes
    curl -d "Written after restore" http://127.0.0.1:8081/notes
    curl http://127.0.0.1:8080/notes
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8081/notes
    curl.exe -d "Written after restore" http://127.0.0.1:8081/notes
    curl.exe http://127.0.0.1:8080/notes
    ```

!!! success "Checkpoint"

    The restored service lists the original note and accepts the new one;
    the original service doesn't contain the new note. Retry after startup
    if needed, then inspect the relevant container's logs.

This file-copy backup suits the stopped notes service. A database needs its
own documented backup procedure.

## Finish

The next commands delete both exercise volumes and their notes. Run them
only when you no longer need those volumes; the archive stays in your
backup folder:

```text
docker stop ark-ft-notes ark-ft-restored
docker rm ark-ft-notes ark-ft-restored
docker volume rm ark-ft-data ark-ft-restore
docker image rm ark-ft-notes:1
```

The [guided storage module](01-give-the-service-a-memory.md) and
[migration kata](katas/README.md) cover more choices and recovery cases.
