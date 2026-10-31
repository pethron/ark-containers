---
title: "Configuration, secrets and readiness"
track: architecture
---

# Configuration, secrets and readiness

The reading list works, so your colleague changes a database setting and
expects the next start to use it. Before trying that, we need to know which
settings configure every process start and which only initialize an empty
data directory. The image documentation supplies that distinction, and it
also tells us what a startup check can reasonably measure.

Use the setup and successful stack from chapter 1, without the cache overlay.
From a fresh checkout, follow the [module setup](README.md) and run
`docker compose -p ark-reading up -d --build --wait`.

## Ask the image a few useful questions

Open the maintained [Postgres image documentation](https://hub.docker.com/_/postgres)
and locate **Environment Variables**, **Docker Secrets**, **Initialization
scripts** and **PGDATA**. Read them against `db` in our file. Which setting
creates the database, where does it read the password, and which path must
our selected major version preserve?

For `postgres:17.6-alpine`, the named volume goes at
`/var/lib/postgresql/data`. The documented default layout changes in major 18,
so changing the major tag calls for a storage and upgrade decision too.
`POSTGRES_USER` and `POSTGRES_DB` establish a superuser and database during
initialization, and scripts under `/docker-entrypoint-initdb.d` run on an
**empty data directory**. Our SQL creates the books and revision tables;
it is not a migration mechanism for an existing database.

Changing the password file after that first start leaves the stored database
password unchanged. The API would read the new file but Postgres would still
expect the old credential. A real rotation needs a coordinated database
password change and application update. Keep the dummy credential unchanged
in this exercise rather than deleting a populated volume to make a mismatch
disappear.

Use the [Nginx image documentation](https://hub.docker.com/_/nginx) to locate
the static-content directory and configuration examples, then match those
paths with `proxy/Dockerfile`. The image runs Nginx in the foreground so
Docker can track its process. Its standard entrypoint and master need writable
runtime locations; our non-root API image has different requirements.
For the later [Redis image](https://hub.docker.com/_/redis), find its
`/data` persistence location and the security warning about exposing the port.
We will deliberately disable its persistence and leave it unpublished.

Before running another unfamiliar image, make the same short inventory:
required settings, initialization behavior, persistent paths, process user,
listener, and a suitable readiness test. It is a more useful starting point
than collecting every environment variable the image happens to support.

## Separate interpolation from container configuration

Compose reads `.env` to substitute values into the model. A value there
reaches a container only if the service configuration passes it, as our API's
`DB_NAME` does through `environment`. The credential is a separate file
mount, and `config` reports that file's source path rather than its contents.

```text
docker compose -p ark-reading config
docker compose -p ark-reading config --services
```

Find the expanded loopback publication and the API's database host. `db`
resolves inside the `back` network; `localhost` inside the API would refer
to the API container itself. Recall the networking exercise: name resolution,
listener availability and host publication are three different questions.

In the healthcheck, `$${POSTGRES_USER}` has two dollar signs so Compose passes
a literal `${POSTGRES_USER}` to the container's shell. That shell then expands
the database's own environment value. A single dollar sign would let Compose
substitute from the host environment too early.

## Observe a database that is running before it is usable

Use a new project for this experiment. The delayed-init overlay adds
`SELECT pg_sleep(12)` before the normal schema script, giving you time to
observe startup. It acts only on a new empty volume; check `docker compose ls`
before reserving `ark-reading-delay`.

=== "Linux (Bash)"

    ```bash
    WEB_PORT=8081 docker compose -p ark-reading-delay -f compose.yaml -f compose.delay.yaml up -d db
    docker compose -p ark-reading-delay -f compose.yaml -f compose.delay.yaml ps
    WEB_PORT=8081 docker compose -p ark-reading-delay -f compose.yaml -f compose.delay.yaml up -d --wait
    ```

=== "Windows (PowerShell)"

    ```powershell
    $env:WEB_PORT = "8081"
    docker compose -p ark-reading-delay -f compose.yaml -f compose.delay.yaml up -d db
    docker compose -p ark-reading-delay -f compose.yaml -f compose.delay.yaml ps
    docker compose -p ark-reading-delay -f compose.yaml -f compose.delay.yaml up -d --wait
    Remove-Item Env:\WEB_PORT
    ```

During initialization the container can be running while its health is
`starting`. Postgres uses a temporary local server to run initialization
scripts; the supplied check uses TCP `127.0.0.1`, so that temporary
Unix-socket-only server does not prematurely satisfy the gate.
`depends_on: condition: service_healthy` lets API startup follow the database
check, and proxy startup follows the API's `/ready` check.

If the delay finishes before you inspect `ps`, read the database logs for
the initialization sequence. The criterion is the condition, not catching
exactly twelve seconds on your machine.

For a condition that never passes, `compose.failure.yaml` replaces the
database check with `false`. It deliberately measures failure even though
Postgres may be serving requests, so use it only on the experiment project:

=== "Linux (Bash)"

    ```bash
    WEB_PORT=8081 docker compose -p ark-reading-delay -f compose.yaml -f compose.failure.yaml up -d --wait
    docker compose -p ark-reading-delay -f compose.yaml -f compose.failure.yaml ps
    WEB_PORT=8081 docker compose -p ark-reading-delay -f compose.yaml up -d --wait
    curl -i http://127.0.0.1:8081/api/ready
    ```

=== "Windows (PowerShell)"

    ```powershell
    $env:WEB_PORT = "8081"
    docker compose -p ark-reading-delay -f compose.yaml -f compose.failure.yaml up -d --wait
    docker compose -p ark-reading-delay -f compose.yaml -f compose.failure.yaml ps
    docker compose -p ark-reading-delay -f compose.yaml up -d --wait
    curl.exe -i http://127.0.0.1:8081/api/ready
    Remove-Item Env:\WEB_PORT
    ```

The command fails because the required health condition does not pass.
The failed gate reports our deliberate probe fault rather than a genuine
database outage. Starting with the base file restores the documented check;
readiness at port 8081 should return HTTP 200 again. Finally remove only this
experiment, including its disposable records:

```text
docker compose -p ark-reading-delay down --volumes
```

## Availability after startup belongs to the application too

Return to the main project and stop only its database. The other services
remain running, so a request can reach the API even though the dependency
has gone away. Predict the response before asking for records:

=== "Linux (Bash)"

    ```bash
    docker compose -p ark-reading stop db
    curl -i http://127.0.0.1:8080/api/books
    docker compose -p ark-reading logs --tail 15 api
    docker compose -p ark-reading start db
    curl -i http://127.0.0.1:8080/api/ready
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker compose -p ark-reading stop db
    curl.exe -i http://127.0.0.1:8080/api/books
    docker compose -p ark-reading logs --tail 15 api
    docker compose -p ark-reading start db
    curl.exe -i http://127.0.0.1:8080/api/ready
    ```

During the outage, expect HTTP 503 and an explicit database-unavailable
message. The API retries **connection establishment** at most three times,
with two-second connection timeouts and short pauses. The API service also
sets one-second, single-attempt resolver options, so a missing service name
cannot hide a long DNS retry behind the database timeout. Each operation
opens a new connection, so subsequent requests reconnect after recovery
instead of keeping a dead socket. SQL and lock timeouts bound database work too.

Writes are not automatically replayed after an uncertain commit: a lost
connection can leave a client unsure whether the write succeeded. Check the
records after recovery before repeating an add or edit. `/ready` also uses
the database and can fail during the outage; Docker marks health, while
Compose does not continuously stop dependents or restart an unhealthy
container. If your first recovery request is early, inspect health and retry
the read after the database is accepting connections.

Now explain which part of the result came from Compose and which came from
application code. Keep the recovered main stack for
[persistence and restore](03-persistence-backup-and-restore.md).
