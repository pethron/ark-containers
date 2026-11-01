---
title: "Connecting containers on a network"
track: runbook
---

# Connecting containers on a network

So far each of our services has worked alone. Real applications rarely do: a
web page asks an API for data, the API asks a database, and so on. In this
chapter a small frontend calls a small API, and we'll make that call work.
You'll reach the frontend from your browser while the API has no published
host port.

## Build and start the services

The module uses its supplied `network-service` fixture. You need Docker
running Linux containers, as set up in module 01, and either a browser or curl.
On Windows, call curl as `curl.exe`. On Linux Engine, prefix Docker commands
with `sudo` if your setup requires it. From the [root of your course checkout](../before-you-start.md#get-the-course-files),
move into the example:

=== "Linux (Bash)"

    ```bash
    cd 06-networking/network-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\06-networking\network-service
    ```

The directory holds two programs, `api.py` and `web.py`, and a `Dockerfile`
that copies both into one image. Its default command starts the API; we'll
start the frontend from the same image by giving `docker run` a different
command.

The chapter creates the image tag `ark-network:v1`, containers `ark-api` and
`ark-web`, and the network `ark-net`, and publishes local port `8080`. Check
`docker image ls ark-network`, `docker ps -a` and `docker network ls` first.
If a tag or name belongs to another task, choose an unused one and use it
throughout the module; don't overwrite someone else's image or remove their
containers. If Docker reports that port 8080 is already in use, choose a free
loopback host port and use it in the frontend's mappings and URLs throughout
this module.

Build the image:

```text
docker build -t ark-network:v1 .
```

## Let the frontend call the API

Start the API. It listens on port `8000` inside its container, and we don't
publish a host port for it:

```text
docker run -d --name ark-api ark-network:v1
```

Now start the frontend. `BACKEND_URL` tells it where to find the API: the
container name `ark-api`, port `8000` and the `/health` path. The command
after the image name, `python /app/web.py`, replaces the image's default
command. We publish the frontend on port `8080` of `127.0.0.1`, the engine
host's loopback address, limiting the intended entry point to that host.
With a remote engine, the address belongs to the remote host. Docker releases
older than 28 have an additional same-network exposure caveat for localhost
publishing, described in the
[port publishing documentation](https://docs.docker.com/engine/network/port-publishing/):

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-web -p 127.0.0.1:8080:8000 \
      -e BACKEND_URL=http://ark-api:8000/health \
      ark-network:v1 python /app/web.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-web -p 127.0.0.1:8080:8000 `
      -e BACKEND_URL=http://ark-api:8000/health `
      ark-network:v1 python /app/web.py
    ```

Both containers are running, so let's ask the frontend for a page:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/
    ```

After a few seconds, the frontend answers, but with bad news:

```json
{"service": "ark-web", "error": "name_resolution"}
```

The frontend couldn't turn the name `ark-api` into an address. We started
both containers without saying anything about networking, so Docker attached
them to its **default network**. They could reach each other there by IP
address, but that network doesn't look up container names. And an IP address
can change when Docker replaces a container, so it's no address to write
into a configuration.

## Give them a network of their own

Create a network for the two services and connect both containers to it:

```text
docker network create ark-net
docker network connect ark-net ark-api
docker network connect ark-net ark-web
```

A network you create yourself comes with a name service: every container on
`ark-net` can find the others by container name. Ask for the page again:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/
    ```

This time the answer holds both services:

```json
{"service": "ark-web", "backend": {"service": "ark-api", "status": "ok"}}
```

Your request reached `ark-web` through the published port, then `ark-web`
called `ark-api` by name across `ark-net` and wrapped its answer in its own.
We didn't restart anything: the frontend looks up the name on every request,
so the new network took effect immediately.

From now on, you don't need the two steps. Pass `--network ark-net` to
`docker run`, and the container joins the network from the start. That's
what we'll do for the rest of the module.

## Only the frontend is published

Compare the two containers' published ports:

```text
docker port ark-web
docker port ark-api
```

The frontend shows the mapping to `127.0.0.1:8080`, while the API prints
nothing. The frontend still reaches the API, because their conversation
happens on `ark-net` and doesn't use a published host port. **Publish a port
only when an intended client needs it.** An unpublished port is not a
complete security boundary: peers on a shared network can reach it, and on
native Linux the engine host can normally reach container addresses too.

This chapter leaves `ark-api`, `ark-web` and `ark-net` running. Next we'll
[diagnose two connection failures](03-diagnose-a-broken-connection.md) using
this same stack.
