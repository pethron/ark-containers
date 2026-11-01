---
title: "Fast track: build an image"
track: runbook
---

# Fast track: build an image

The message service arrived as an image. This time we'll build it from the
supplied Dockerfile, check what runs, and build a second service that needs
a Python library.

You need the course checkout and Docker with Linux containers from
[Before you start](../web/before-you-start.md), plus internet access for base
images and packages. On Linux Engine, prefix Docker commands with `sudo` if
required. Check `docker ps -a` and `docker image ls`: container names
`ark-ft-build` and `ark-ft-template`, tags `ark-ft-build:1` and
`ark-ft-template:1`, and loopback port 8080 must be free. Use unused
alternatives consistently if they belong to other work.

## Build and run the message service

From the root of the course checkout, enter the supplied build context:

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\message-service
    ```

Open `Dockerfile`: it chooses a Python base, copies `app.py`, creates the
`ark` user and records the command that starts the service. Build it twice;
the second build can reuse unchanged steps marked `CACHED`:

```text
docker build --progress=plain -t ark-ft-build:1 .
docker build --progress=plain -t ark-ft-build:1 .
docker image inspect --format '{{.Config.User}} {{json .Config.Cmd}}' ark-ft-build:1
docker run -d --name ark-ft-build -e MESSAGE="Built for the team" -p 127.0.0.1:8080:8000 ark-ft-build:1
docker exec ark-ft-build id -un
docker run --rm ark-ft-build:1 python --version
```

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

    The service answers `Built for the team` and `ok`; its user is `ark`.
    The one-off `python --version` command exits without replacing the
    running service. If HTTP isn't ready, retry and then inspect
    `docker logs ark-ft-build`.

## Build a service with a dependency

Stop the first service to free port 8080, then move to the supplied
template service:

```text
docker stop ark-ft-build
docker rm ark-ft-build
```

=== "Linux (Bash)"

    ```bash
    cd ../template-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location ..\template-service
    ```

The supplied Dockerfile installs the library and starts the template service.
Build and start that image:

```text
docker build --progress=plain -t ark-ft-template:1 .
docker run -d --name ark-ft-template -e AUDIENCE="the release team" -p 127.0.0.1:8080:8000 ark-ft-template:1
docker exec ark-ft-template python -c "import jinja2; print(jinja2.__version__)"
```

Open `http://127.0.0.1:8080/` and `/health` in your browser, or use the
same curl commands as above.

!!! success "Checkpoint"

    The page says `Hello the release team`, `/health` says `ok`, and the
    library import prints a version. If the build fails while downloading
    packages, read its error and check connectivity before retrying.

## Finish

```text
docker stop ark-ft-template
docker rm ark-ft-template
docker image rm ark-ft-build:1 ark-ft-template:1
```

The shared base images and build cache remain. To write a Dockerfile and
compare dependency-cache behavior yourself, follow the
[guided build](01-package-the-service-in-an-image.md) and
[packaging kata](katas/README.md).
