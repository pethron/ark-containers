---
title: "Fast track: connect two services"
track: runbook
---

# Fast track: connect two services

The frontend needs an answer from an API, but your browser only needs a
port for the frontend. We'll connect both services, interrupt their network
and recover the request.

You need the course checkout, Docker with Linux containers and curl from
[Before you start](../web/before-you-start.md). The build may need internet
access for its base image. On Linux Engine, prefix Docker commands with
`sudo` if required. Check `docker ps -a`, `docker network ls` and
`docker image ls`: `ark-ft-api`, `ark-ft-web`, network `ark-ft-net`, tag
`ark-ft-network:1` and loopback port 8080 must be free. Choose unused
alternatives and use them consistently, including in `BACKEND_URL`.

## Connect the services

From the checkout root, enter the supplied network service:

=== "Linux (Bash)"

    ```bash
    cd 06-networking/network-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\06-networking\network-service
    ```

Build the image, create a network and start both containers. The frontend
uses the API's container name and port 8000; only the frontend gets a
published host port:

```text
docker build -t ark-ft-network:1 .
docker network create ark-ft-net
docker run -d --name ark-ft-api --network ark-ft-net ark-ft-network:1
docker run -d --name ark-ft-web --network ark-ft-net -e BACKEND_URL=http://ark-ft-api:8000/health -p 127.0.0.1:8080:8000 ark-ft-network:1 python /app/web.py
docker port ark-ft-web
docker port ark-ft-api
```

=== "Linux (Bash)"

    ```bash
    curl -i http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -i http://127.0.0.1:8080/
    ```

!!! success "Checkpoint"

    The response is HTTP 200 and contains both `ark-web` and the API's
    `ok` status. `docker port` shows a mapping for the frontend and none
    for the API. If either service is still starting, retry the request.
    An unpublished API can still be reached by network peers and, on a
    native Linux engine, normally by the engine host.

## Interrupt and recover

Disconnect the API and inspect the network:

```text
docker network disconnect ark-ft-net ark-ft-api
docker network inspect --format '{{range .Containers}}{{.Name}} {{end}}' ark-ft-net
```

=== "Linux (Bash)"

    ```bash
    curl -i http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -i http://127.0.0.1:8080/
    ```

The frontend should answer HTTP 502 with `name_resolution`; the request is
also recorded in `docker logs --tail 3 ark-ft-web`. Reconnect the API and
request the page again:

```text
docker network connect ark-ft-net ark-ft-api
```

=== "Linux (Bash)"

    ```bash
    curl -i http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -i http://127.0.0.1:8080/
    ```

!!! success "Checkpoint"

    The frontend returns HTTP 200 and the API's `ok` again. If it doesn't,
    check both containers with `docker ps -a`, their network membership and
    `docker logs ark-ft-web`.

## Finish

These two services hold no data, so `-f` stops and removes them immediately.
For a service that needs time to finish its work, stop it before removing it.

```text
docker rm -f ark-ft-web ark-ft-api
docker network rm ark-ft-net
docker image rm ark-ft-network:1
```

For more failure cases, follow the
[guided connection](01-connect-two-services.md) or try the
[reconnection kata](katas/README.md).
