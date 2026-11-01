---
title: "Fast track: run an application with Compose"
track: runbook
---

# Fast track: run an application with Compose

The team's reading list runs as four parts: an Nginx proxy, an API, a
Postgres database and, later, a Redis cache. We'll start it from its Compose
files, keep its records through a backup and restore, add the cache, then
change the code while the stack runs.

You need the course checkout, Docker with Linux containers, Compose 2.32 or
later (`docker compose version`) and curl from
[Before you start](../web/before-you-start.md). The first build downloads
images and Python packages. On Linux Engine, prefix Docker commands with
`sudo` if required. Check `docker compose ls -a` and `docker ps -a`: projects
`ark-reading` and `ark-reading-restore`, and loopback ports 8080 and 8081,
must be free. If not, choose other project names, set `WEB_PORT` in `.env`
to a free port, and use your values in every command and URL below. Don't
take over or remove another project.

## Start the stack and add a book

From the checkout root, enter the application directory and create the
database password from the dummy example, unless you already have one:

=== "Linux (Bash)"

    ```bash
    cd advanced/compose-workflows/application
    [ -e secrets/db-password.txt ] || cp secrets/db-password.example secrets/db-password.txt
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\advanced\compose-workflows\application
    if (-not (Test-Path .\secrets\db-password.txt)) { Copy-Item .\secrets\db-password.example .\secrets\db-password.txt }
    ```

`compose.yaml` builds `proxy` and `api`, runs `db` from the Postgres image,
and passes the password as a file secret. `.env` supplies `WEB_PORT` and the
database names. Read the resolved model, then start it; `--wait` returns
once the health checks pass:

```text
docker compose -p ark-reading config
docker compose -p ark-reading up -d --build --wait
docker compose -p ark-reading ps
```

Add a book through the proxy and read the list back:

=== "Linux (Bash)"

    ```bash
    curl -i -H "Content-Type: application/json" --data-binary @requests/add-book.json http://127.0.0.1:8080/api/books
    curl http://127.0.0.1:8080/api/books
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -i -H "Content-Type: application/json" --data-binary "@requests\add-book.json" http://127.0.0.1:8080/api/books
    curl.exe http://127.0.0.1:8080/api/books
    ```

!!! success "Checkpoint"

    The POST returns `201` and the list contains the book. `ps` shows a
    port only for `proxy`, on `127.0.0.1:8080`; `api` and `db` are reachable
    only inside the project's networks. You can also open
    `http://127.0.0.1:8080/` in a browser. If a request fails, read
    `docker compose -p ark-reading logs --tail 20 proxy api db`.

## Back up and restore the records

Dump the database inside its container, then copy the file to `backups`:

=== "Linux (Bash)"

    ```bash
    docker compose -p ark-reading exec -T db pg_dump -U reading -d reading -Fc -f /var/lib/postgresql/reading.dump
    db=$(docker compose -p ark-reading ps -q db)
    docker cp "${db}:/var/lib/postgresql/reading.dump" backups/reading.dump
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker compose -p ark-reading exec -T db pg_dump -U reading -d reading -Fc -f /var/lib/postgresql/reading.dump
    $db = docker compose -p ark-reading ps -q db
    docker cp "${db}:/var/lib/postgresql/reading.dump" .\backups\reading.dump
    ```

Start a second, empty project on port 8081 and restore the dump into it.
`WEB_PORT` from the shell overrides the value in `.env`:

=== "Linux (Bash)"

    ```bash
    WEB_PORT=8081 docker compose -p ark-reading-restore up -d --build --wait
    restore_db=$(docker compose -p ark-reading-restore ps -q db)
    docker cp backups/reading.dump "${restore_db}:/var/lib/postgresql/reading.dump"
    docker compose -p ark-reading-restore exec -T db pg_restore -U reading -d reading --clean --if-exists --no-owner --exit-on-error /var/lib/postgresql/reading.dump
    curl http://127.0.0.1:8081/api/books
    ```

=== "Windows (PowerShell)"

    ```powershell
    $env:WEB_PORT = "8081"
    docker compose -p ark-reading-restore up -d --build --wait
    Remove-Item Env:\WEB_PORT
    $restoreDb = docker compose -p ark-reading-restore ps -q db
    docker cp .\backups\reading.dump "${restoreDb}:/var/lib/postgresql/reading.dump"
    docker compose -p ark-reading-restore exec -T db pg_restore -U reading -d reading --clean --if-exists --no-owner --exit-on-error /var/lib/postgresql/reading.dump
    curl.exe http://127.0.0.1:8081/api/books
    ```

!!! success "Checkpoint"

    Port 8081 returns the same books as port 8080. The restore project has
    its own volume, so remove it with its data once you've compared them:
    `docker compose -p ark-reading-restore down --volumes --rmi local`.
    Only restore into an empty project like this one: `--clean` replaces
    the target's tables.

## Add the cache overlay

A second file adds Redis and points the API at it. Compose merges the files
in order, so list both in every command for this stack from now on:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml config --services
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml up -d --wait
```

Read the list twice, then the API's counters:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/api/books
    curl http://127.0.0.1:8080/api/books
    curl http://127.0.0.1:8080/api/stats
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/api/books
    curl.exe http://127.0.0.1:8080/api/books
    curl.exe http://127.0.0.1:8080/api/stats
    ```

!!! success "Checkpoint"

    `config --services` lists `cache` alongside the other services, and
    `stats` reports at least one hit. Your book is still there because the
    database volume was kept when Compose recreated the API.

## Change the code while it runs

`compose.dev.yaml` adds Watch rules: source changes are copied into the API
container and the process restarts. Start the development model, then keep
Watch running in this terminal:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml up -d --build --wait
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml watch --no-up --prune=false
```

When Watch reports it's enabled, change `GREETING` in `api/src/app.py` to
`"Our team's next reading list"` and save. In a second terminal, in the same
directory:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/api/info
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/api/info
    ```

The new greeting appears without a manual rebuild; retry if the API is
still restarting. Under WSL, Watch may miss edits to a checkout on the
Windows drive (`/mnt/c/...`); keep the checkout in the Linux filesystem,
such as your home directory.

Then run the unit tests in their own container. The
`tests` service belongs to the `test` profile, so a normal `up` skips it:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml build tests
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml run --rm --no-deps tests
```

Stop Watch with Ctrl+C, restore the original greeting
`"Team reading list"`, and rebuild without the development file. Synced
changes reach the image only through a build:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml up -d --build --wait
```

!!! success "Checkpoint"

    The tests end with `OK`, `/api/info` returns the original greeting
    again, and the book list is unchanged.

## Finish

Remove the project's containers, networks and built images, keeping the
records volume:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml down --rmi local
docker image rm ark-reading-tests
```

Add `--volumes` to `down` only when you mean to delete the reading list.
The dump in `backups` stays on your computer; delete it when you no longer
need it. The [guided chapters](../advanced/compose-workflows/README.md)
explain readiness, the cache's freshness and how to diagnose a broken
route. To practise the Compose file itself, start with the
[small stack](01-describe-the-stack-in-a-file.md).