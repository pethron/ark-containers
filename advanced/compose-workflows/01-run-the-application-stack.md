---
title: "Running a multi-service stack"
track: runbook
---

# Running a multi-service stack

A colleague opens the reading list, adds a book, and refreshes the page.
Our first useful result is seeing that book again. We already know how to
package an API and connect containers; now we'll bring those skills together
with a database that has its own initialization and storage requirements.

Use the [module setup](README.md#start-from-a-clean-directory-not-a-running-core-lab)
first. All commands in this chapter run from `application`, with the dummy
secret file present and port 8080 available. Nothing from a core lab needs
to be running.

## Read the route before starting it

Open `compose.yaml` and follow the three runtime services. `proxy` builds an
Nginx image containing the supplied HTML and JavaScript. Your browser loads
that UI, whose requests go to `/api/books` on the same entry point. Nginx
forwards the request to `api:8000/books`, and the API connects to `db:5432`
to read or write records.

There are two project-scoped networks: `front` joins proxy and API, and `back`
joins API and database. The proxy cannot directly reach the database on those
networks. These connections use **service names**, so a replacement API can
have a different address without requiring an IP in the application config.
The networks separate membership; they do not authenticate requests or stop
a host administrator from inspecting containers.

Only `proxy` has `ports`, with `127.0.0.1:8080:80`: your computer's port 8080
forwards to its container port 80 and accepts local connections only. The API
and database need no host publication to communicate. `EXPOSE 8000` in the
API Dockerfile documents its listener; it does not publish it.

The `records` volume belongs to the project, rather than an individual
database container. Two services receive the `db_password` secret mount:
Postgres uses its documented `POSTGRES_PASSWORD_FILE` convention, and our
API explicitly reads `DB_PASSWORD_FILE` in its code. Nginx has no reason to
receive that file. We'll examine the startup conditions in chapter 2; for
this first run they let Compose wait for usable services.

## Start and save something

The next command builds the supplied application images, creates the project's
networks and database volume, and starts the stack. `-d` leaves the services
running after the command returns; `--wait` makes that return depend on the
configured running/healthy conditions rather than container creation alone.
If it fails, keep the error and inspect it instead of assuming the UI is ready.

```text
docker compose -p ark-reading up -d --build --wait
docker compose -p ark-reading ps
```

Open <http://127.0.0.1:8080>, add **The team's first book**, and refresh.
The title should remain visible, with a saved-book count. The UI supports
editing and removing records too, but keep this first one for the storage
experiment.

If you prefer curl, the supplied JSON file lets you create the same record
without shell-specific JSON quoting. `--data-binary` sends the file's bytes,
and the content-type header tells the API to expect JSON. Choose this or
the UI add, rather than creating the same book twice:

=== "Linux (Bash)"

    ```bash
    curl -i -H "Content-Type: application/json" --data-binary "@requests/add-book.json" http://127.0.0.1:8080/api/books
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -i -H "Content-Type: application/json" --data-binary "@requests\add-book.json" http://127.0.0.1:8080/api/books
    ```

Now read the same records without the UI. On Windows, use `curl.exe` so
PowerShell calls the curl program rather than an older shell alias.

=== "Linux (Bash)"

    ```bash
    curl -i http://127.0.0.1:8080/api/books
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -i http://127.0.0.1:8080/api/books
    ```

Expect HTTP 200 and JSON with a `books` array containing an `id` and your
title. Compare it with the UI. That agreement verifies the route through
Nginx and the API to a saved record, whereas the HTML loading alone would
only verify the static-content part of the proxy.

## Locate each boundary

Look at the ports column from `ps`. Only Nginx should have a loopback
publication; a database port listed without a host address is not a published
port. Then inspect the selected service logs:

```text
docker compose -p ark-reading logs --tail 20 proxy api db
docker compose -p ark-reading exec -T api id
```

The API runs as `app`, UID 10001, as set by its Dockerfile. The Postgres image
starts with its own entrypoint assumptions and drops to its database OS user;
Nginx's standard image has a root master and unprivileged workers. Forcing
the API's `user` setting onto every image would skip the reasoning each
entrypoint needs. In the next chapter we'll use their documentation to decide
which settings actually belong to each service.

Before moving on, predict what would happen if the UI called
`http://api:8000/books` directly from your browser. Where would that name be
resolved? The browser uses your host's networking; the supplied UI keeps its
requests on the published proxy path so container-only names stay inside
the stack.

## Pause without resetting the reading list

If you need to stop here, `docker compose -p ark-reading stop` pauses the
containers. Resume with `docker compose -p ark-reading up -d --wait`.
`down` removes this project's containers and networks while retaining its
named volume:

```text
docker compose -p ark-reading down
```

Do not add `--volumes` while you want the saved records. Keep the project name
consistent when you return; chapter 3 will show why a different name creates
a separate storage namespace. Continue with
[configuration and readiness](02-configuration-and-readiness.md).
