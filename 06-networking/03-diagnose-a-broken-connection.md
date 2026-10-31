---
title: "Troubleshooting container connections"
track: runbook
---

# Troubleshooting container connections

Sooner or later the frontend will answer with an error instead of the API's
data. The tempting move is to restart everything and hope. Let's do better:
we'll break the connection in two different ways and read what the frontend
tells us each time, so you'll recognize the symptoms when it happens for
real.

Start breaking things only once the answer from the previous chapter still
holds both services:

```json
{"service": "ark-web", "backend": {"service": "ark-api", "status": "ok"}}
```

## The API leaves the network

Disconnect the API from `ark-net`, then ask the frontend for a page and
read its latest logs:

=== "Linux (Bash)"

    ```bash
    docker network disconnect ark-net ark-api
    curl -i http://127.0.0.1:8080/
    docker logs --tail 3 ark-web
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker network disconnect ark-net ark-api
    curl.exe -i http://127.0.0.1:8080/
    docker logs --tail 3 ark-web
    ```

The `-i` option makes curl print the HTTP status line too. The frontend
answers `502 Bad Gateway` with `name_resolution`, and its log says
`Backend request failed: name_resolution`. The API container is still
running, yet the frontend can't find it. Containers that share no network
you created get the same error, because only those networks look up
container names. **A name that doesn't resolve points at the
name itself or at network membership.** Check the spelling, then check that
both containers are on the same network you created:

```text
docker network inspect --format '{{range .Containers}}{{.Name}} {{end}}' ark-net
```

Only `ark-web` is listed. Reconnect the API and the page works again:

=== "Linux (Bash)"

    ```bash
    docker network connect ark-net ark-api
    curl http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker network connect ark-net ark-api
    curl.exe http://127.0.0.1:8080/
    ```

## The frontend calls the wrong port

This time the name will be right and the port wrong. A container's
environment is fixed when it starts, so replace the frontend with one that
calls port `8001`. Note `--network ark-net`: the new container joins the
network straight away.

=== "Linux (Bash)"

    ```bash
    docker rm -f ark-web
    docker run -d --name ark-web --network ark-net -p 127.0.0.1:8080:8000 \
      -e BACKEND_URL=http://ark-api:8001/health \
      ark-network:v1 python /app/web.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker rm -f ark-web
    docker run -d --name ark-web --network ark-net -p 127.0.0.1:8080:8000 `
      -e BACKEND_URL=http://ark-api:8001/health `
      ark-network:v1 python /app/web.py
    ```

Before running the next request, predict what the frontend will report.
Then check:

=== "Linux (Bash)"

    ```bash
    curl -i http://127.0.0.1:8080/
    docker logs --tail 3 ark-web
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -i http://127.0.0.1:8080/
    docker logs --tail 3 ark-web
    ```

If curl can't connect at all, the frontend is still starting: wait a second
and retry. The answer is still `502`, but the error is now `connection`. The
name resolved, the frontend found the API's address, and nothing was
listening on port `8001` there. Compare the URL with the port the API
listens on, `8000`. `docker port ark-api` can't help here: it reports host
mappings, and the API has none. Containers on the same network talk to each
other's container ports directly.

Put the right URL back:

=== "Linux (Bash)"

    ```bash
    docker rm -f ark-web
    docker run -d --name ark-web --network ark-net -p 127.0.0.1:8080:8000 \
      -e BACKEND_URL=http://ark-api:8000/health \
      ark-network:v1 python /app/web.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker rm -f ark-web
    docker run -d --name ark-web --network ark-net -p 127.0.0.1:8080:8000 `
      -e BACKEND_URL=http://ark-api:8000/health `
      ark-network:v1 python /app/web.py
    ```

Request the page once more and you'll see both services in the answer. As
before, if curl can't connect, give the new frontend a second to start and
retry.

## Read the symptom first

| What the frontend reports | What it means | Where to look |
|---|---|---|
| `name_resolution` | The name doesn't match a container on a shared network | Spelling, `docker network inspect` |
| `connection` | The address was found, but nothing answered on that port | The port in the URL, the API's listening port and status |
| An HTTP error such as `404` | The API answered, but didn't like the request | The path in the URL, the API's logs |

The last row belongs to the application: the
connection worked, and the frontend passes the API's status back to you.
The same three checks work for any pair of services, whatever language
they're written in.

The chapter leaves `ark-api`, `ark-web` and `ark-net` running with the right
URL. When you're done with them, remove only the resources created here:

```text
docker rm -f ark-web ark-api
docker network rm ark-net
```

The [kata](katas/README.md) gives you a broken stack to repair on your own.
It sets up its own containers and network, so you can start it with or
without this stack running.
