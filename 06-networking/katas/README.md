---
title: "Kata: reconnect the services"
track: kata
---

# Kata: reconnect the services

Someone renamed the API before a demo and rebuilt the stack in a hurry. The
frontend still answers on your computer, but the page says it can't reach
its backend. While you're at it, you notice that the API has a published
port of its own, even though nobody outside Docker should call it.

Your job is to get the request working again and leave only the frontend
published. Keep the supplied programs and image unchanged: read the
frontend's answer and the containers' settings before you change anything.

## Set up the broken stack

You need Docker running Linux containers and curl; on Windows, call it as
`curl.exe`. The kata uses its own names, so it can run alongside the
chapters' containers or without them. Check that the names `ark-kata-net`,
`ark-kata-api` and `ark-kata-web` and local ports `8080` and `8081` are free.
From the [root of your course checkout](../../before-you-start.md#get-the-course-files), build the supplied image and start
the broken stack:

=== "Linux (Bash)"

    ```bash
    cd 06-networking/network-service
    docker build -t ark-network:v1 .
    docker network create ark-kata-net
    docker run -d --name ark-kata-api --network ark-kata-net \
      -p 127.0.0.1:8081:8000 ark-network:v1
    docker run -d --name ark-kata-web --network ark-kata-net \
      -p 127.0.0.1:8080:8000 \
      -e BACKEND_URL=http://ark-api-old:8000/health \
      ark-network:v1 python /app/web.py
    curl -i http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\06-networking\network-service
    docker build -t ark-network:v1 .
    docker network create ark-kata-net
    docker run -d --name ark-kata-api --network ark-kata-net `
      -p 127.0.0.1:8081:8000 ark-network:v1
    docker run -d --name ark-kata-web --network ark-kata-net `
      -p 127.0.0.1:8080:8000 `
      -e BACKEND_URL=http://ark-api-old:8000/health `
      ark-network:v1 python /app/web.py
    curl.exe -i http://127.0.0.1:8080/
    ```

If the request arrives before the frontend is ready, wait a second and retry.

## Restore the connection

You may replace either container, but keep both on `ark-kata-net`. You're
done when all of these are true:

- `http://127.0.0.1:8080/` answers with both `ark-web` and `ark-api`.
- The frontend reaches the API by its container name on port `8000`.
- Only the frontend has a published port, bound to `127.0.0.1`.
- No container IP address appears in any configuration.

Write down which part of the answer told you what kind of failure it was.
Then try a variation: give the API a different container name of your
choice, update the frontend to match, and check that the page still works.

<details>
<summary>Hint 1: start from the answer</summary>

Look at the error in the frontend's answer, and compare it with the table at
the end of [chapter 03](../03-diagnose-a-broken-connection.md):
`name_resolution` means the name didn't match a container on a shared
network, while `connection` means the address was found but nothing answered
on that port.

</details>

<details>
<summary>Hint 2: compare names</summary>

List the containers on `ark-kata-net` with `docker network inspect`, then
compare their names with the host in the frontend's `BACKEND_URL`.
`docker inspect ark-kata-web` shows its environment.

</details>

<details>
<summary>Hint 3: replace what has to change</summary>

A container's environment and published ports are fixed when it starts.
Recreate the frontend with a `BACKEND_URL` that uses an existing name, and
recreate the API without `-p`.

</details>

## Reset the kata

When you're done, remove only the kata containers and their network. If you
renamed the API, use your new name in place of `ark-kata-api`:

```text
docker rm -f ark-kata-web ark-kata-api
docker network rm ark-kata-net
```

The `ark-network:v1` image stays available for the chapters. Remove it with
`docker image rm ark-network:v1` once no container of this module uses it.
