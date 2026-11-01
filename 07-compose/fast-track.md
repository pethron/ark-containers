---
title: "Fast track: run an application with Compose"
track: runbook
---

# Fast track: run an application with Compose

The team's reading list runs as four parts: an Nginx proxy, an API, a
Postgres database and, later, a Redis cache. Starting them by hand would mean
a `docker run` for each container, plus two networks, a volume and a
password file to wire in, all in the right order. Compose lets us describe
that arrangement once in a file and bring it up with one command, so on this
page we'll run the whole application: add a book, check that a backup of it
really restores, add the cache, then change the code while the stack keeps
running.

You'll need the course checkout, Docker with Linux containers, curl and
Compose 2.32 or later, which `docker compose version` reports; all of them
are covered in [Before you start](../web/before-you-start.md). The first
build may need to download images and Python packages, so allow time for
those before expecting a response. On Linux Engine, prefix Docker commands
with `sudo` if your setup requires it.

Everything we create belongs to two Compose projects, `ark-reading` and
`ark-reading-restore`, published on loopback ports 8080 and 8081. Run
`docker compose ls -a` and `docker ps -a` first to make sure those names and
ports are still free on your machine. If one is taken, pick other project
names or set `WEB_PORT` in `.env` to a free port, and carry your values
through every command and URL on this page, so we never take over or remove
a project that belongs to someone else.

## Start the stack and add a book

From the checkout root, move into the application's directory. Its database
password is read from a file that Git ignores, so we copy the dummy example
into place; if you already have a password file there, the command leaves it
alone:

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

Before starting anything, it's worth reading what Compose is about to do.
`compose.yaml` builds two images, for `proxy` and `api`, runs `db` from the
Postgres image and hands the password file to both the API and the database
as a secret. `.env` fills in the variables the file refers to, the port and
the database names, and `config` prints the model with every value resolved.

`up` then builds the images and starts the services in dependency order.
With `--wait`, a successful return means their configured health checks have
passed. If startup fails, keep the error and inspect the service logs before
continuing; getting the prompt back on its own doesn't establish readiness:

```text
docker compose -p ark-reading config
docker compose -p ark-reading up -d --build --wait
docker compose -p ark-reading ps
```

In the `ps` output, only `proxy` shows a published port, `127.0.0.1:8080`.
The proxy reaches the API over one Compose network and the API reaches the
database over another, so the host needs just this one entry point. Mind
that the API and the database are still reachable by peers on their
networks and, on a native Linux host, at their container addresses.

Now let's save a book through that entry point, which is the same route the
browser's requests take. The POST sends the JSON in `requests/add-book.json`,
and the second request reads the list back:

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

Open `http://127.0.0.1:8080/` in a browser too, and compare its list with the
JSON response: both should show the book you just saved. If a request fails,
the last lines of the three
services' logs usually show where it stopped:
`docker compose -p ark-reading logs --tail 20 proxy api db`.

!!! success "Checkpoint"

    The POST returns `201` and the list contains the book. In `ps`, only
    `proxy` publishes a port, on `127.0.0.1:8080`.

## Back up and restore the records

Our book now lives in the project's `records` volume, so it survives when
Compose recreates the database container. A backup covers the accidents a
volume can't survive, such as deleting it by mistake, but it's only worth
something if it restores. We'll take a dump, load it into a second, empty
copy of the stack and compare the two lists.

`pg_dump` runs inside the database container, where the Postgres tools
already are, and writes the dump in the custom format (`-Fc`) that
`pg_restore` reads. `docker cp` then copies the file to `backups` on your
computer, using the container ID that `ps -q db` returns:

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

With the dump safely on your computer, we need somewhere to restore it: a
second project, `ark-reading-restore`, started from the same files. Compose
prefixes networks and volumes with the project name, so the copy gets its
own empty `records` volume and can't touch the original.

It also needs its own host port. A `WEB_PORT` set in the shell overrides the
value in `.env`, and the PowerShell version removes the variable again once
the stack is up. Then the dump goes into the new database container, and
`pg_restore` loads it.

Restore only into this new, empty project. `--clean --if-exists` drops the
dump's tables from the target before recreating them with the backed-up rows.
Here it replaces the empty schema created at first startup; pointed at a
project with existing records, it would replace those tables too.

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

The last request asks the copy for its list. Compare it with port 8080:
matching books show that the dump can recover the application's records,
rather than merely that a file was copied.

!!! success "Checkpoint"

    Port 8081 returns the same books as port 8080.

The copy has done its job. It owns its volume, so remove it together with
its data and the images it built, and leave `ark-reading` running for the
next step:
`docker compose -p ark-reading-restore down --volumes --rmi local`.

## Add the cache overlay

Every time someone opens the page, the API reads the whole list from
Postgres, even when nothing has changed since the last request. A cache can
answer those repeated reads. Its Compose configuration lives in a separate
file, `compose.cache.yaml`, so the base stack still runs without it. The overlay
adds a Redis service and gives the API its address.

Compose merges the files in the order we name them, with later files adding
to or overriding earlier ones. That has a practical consequence: running `up`
without the overlay would put the API back without its cache, so from
now on every command for this stack lists both files. `config --services`
shows the merged model before `up` changes anything:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml config --services
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml up -d --wait
```

`cache` should now appear next to `proxy`, `api` and `db`. Since the API
waits for the cache's health check, `up` starts Redis first and then
recreates the API with its new address. Nothing changed in the database's
configuration, so Postgres keeps running on the same volume.

Is the cache actually doing anything? The API counts its hits and misses in
memory, so ask for the list twice and then read those counters:

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

If the list isn't already cached, the first request reads its rows from
Postgres and stores them in Redis for 30 seconds. A second request within
that time can reuse them. The API still checks the database's list revision
on every read; the cache saves repeated queries for the rows.

Refreshing the browser can populate the cache too, so don't expect exact
counter totals. If there is no hit, repeat the two reads close together
without editing a book between them, then check `stats` again. A cache error
calls for the API and cache logs rather than more refreshes.

!!! success "Checkpoint"

    `config --services` lists `cache` alongside the other services,
    `stats` reports at least one hit, and your book is still in the list.

## Change the code while it runs

Rebuilding an image after every edit gets tedious quickly, so the
application ships a development overlay. `compose.dev.yaml` adds **Watch**
rules to the API: when a file under `api/src` changes, Compose copies it into
the running container and restarts the process, and a change to
`requirements.txt` triggers a full rebuild. The first command starts the
stack with all three files; the second keeps Watch running in the foreground
of this terminal:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml up -d --build --wait
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml watch --no-up --prune=false
```

When Watch reports that it's enabled, open `api/src/app.py`, change
`GREETING` to `"Our team's next reading list"` and save. Watch is holding
this terminal, so ask the API for its greeting from a second one, in the
same directory:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/api/info
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/api/info
    ```

The new greeting should come back without any manual rebuild. If the
request fails or still shows the old text, the API is probably in the middle
of its restart, so give it a moment and try again. Under WSL, Watch may miss
edits to a checkout on the Windows drive (`/mnt/c/...`); if nothing changes,
move the checkout into the Linux filesystem, such as your home directory.

The API also has unit tests, and they run in a container of their own. The
`tests` service belongs to the `test` profile, which is why none of our `up`
commands has started it. `build` prepares its image, and `run --rm` starts
it once and removes the container when the tests finish. This service has
no external network, secret or data mounts, keeping the unit tests separate
from the running stack and its records:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml build tests
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml -f compose.dev.yaml run --rm --no-deps tests
```

Watch has been changing the running container, while the image still holds
the code from its last build. To close the loop, stop Watch with Ctrl+C, put
the original greeting `"Team reading list"` back in `app.py`, and rebuild
with the base and cache files only. The API then runs again from an image
built from the code you've just restored:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml up -d --build --wait
```

!!! success "Checkpoint"

    The tests end with `OK`, `/api/info` returns the original greeting
    again, and the book list is unchanged.

## Finish

When you're done, remove the project's containers, networks and the images
it built, along with the separate image for the tests. Leaving out
`--volumes` keeps the `records` volume, so your reading list is still there
the next time you start the project:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml down --rmi local
docker image rm ark-reading-tests
```

Add `--volumes` to `down` only when you mean to delete the reading list
itself. The dump in `backups` also stays on your computer, so delete it when
you no longer need it.

We've moved quickly through a lot of Compose. The
[guided chapters](../advanced/compose-workflows/README.md) take the same
application step by step, explaining what `--wait` actually waits for, how
the cache keeps the list fresh and how to diagnose a broken route. If you'd
rather practise writing the Compose file itself, start with the
[small stack](01-describe-the-stack-in-a-file.md).