---
title: "Adding a Redis cache"
track: architecture
---

# Adding a Redis cache

The team refreshes the same reading list several times between edits.
We can reuse the result of that record query for a short time, but the useful
question is whether we still return the right list after someone changes it.
Let's add a cache and measure its work rather than inventing a speed target
that depends on your laptop.

Keep the main `ark-reading` project and at least one saved record. From a
fresh checkout, use the [module setup](README.md), start chapter 1 and add a
book. A restored second project is not needed here.

## Add a service without replacing the description

`compose.cache.yaml` is an **overlay**: Compose merges it with the base file
in the order given by `-f`. It adds Redis on `back` and passes `CACHE_HOST=cache`
to the API, while retaining the database dependency from the base description.
The API starts after Redis's `ping` healthcheck passes.

The Redis image documentation identifies `/data` as its persistence location.
Here `--save "" --appendonly no` disables both snapshot and append-only
persistence, and a `tmpfs` mount gives `/data` disposable memory-backed
storage. Its standard entrypoint drops privileges to the Redis user.
We leave the cache port unpublished, consistent with the image's warning
that exposing an unauthenticated Redis service makes its data accessible.
This isolated local example is not a general authentication configuration.

Start the merged model and inspect it:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml config --services
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml up -d --wait
```

The runtime model now contains four services. From this point, include both
files in commands that create or update this stack; omitting an overlay
changes the desired configuration. The `test` profile remains off during normal
operation.

## Count work, then change the result

The API caches the `books` query result under a key containing the database's
list revision. Each write advances that revision in the same transaction as
the record change, then tries to delete the previous key. A GET reads the
current revision from Postgres before selecting a cache entry; on a miss,
it reads the rows and stores them for 30 seconds.

That design saves repeated **record queries**, while still contacting Postgres
for the revision on every read. It trades some cache benefit for straightforward
freshness, and keeps a database outage visible even when cached rows exist.
The old key's expiry bounds leftover entries if deletion fails.

Use the stats endpoint before and after two reads:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/api/stats
    curl http://127.0.0.1:8080/api/books
    curl http://127.0.0.1:8080/api/books
    curl http://127.0.0.1:8080/api/stats
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/api/stats
    curl.exe http://127.0.0.1:8080/api/books
    curl.exe http://127.0.0.1:8080/api/books
    curl.exe http://127.0.0.1:8080/api/stats
    ```

Expect a miss followed by a hit if the entry wasn't already populated or
expired. `db_reads` counts full list queries, while `revision_checks` counts
the smaller freshness queries. The UI can also generate reads, so compare
counter changes rather than requiring fixed totals. Counters belong to this
API process and reset when it restarts.

Edit the book in the UI, refresh, and check stats again. You should see the
new title immediately and an increased `invalidations` counter. A successful
edit advances the revision; deletion and insertion use the same mechanism.
The API reads revision and rows in one repeatable-read transaction, so a
concurrent edit cannot make it cache old rows under a new revision.

## Keep working through a cache outage

Predict what would happen if Redis disappeared between reading and editing.
Stop only the cache, edit the book again in the UI, then start Redis and
refresh:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml stop cache
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml logs --tail 15 api
```

Make the edit now, then run:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml start cache
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml logs --tail 20 api
```

The edit should succeed through Postgres while the cache is unavailable;
`cache_errors` makes the fallback observable. The cache client uses short
socket timeouts and no automatic request retry, so an optional dependency
doesn't turn each read into a long wait. When Redis returns, the next read
fetches the current rows from Postgres and repopulates the cache.

This stop/start discards Redis's keys because persistence is disabled.
It demonstrates fallback and recovery, but leaves no old entry behind to
test failed deletion. If an old entry survived a connection failure instead,
the newer database revision would select a different key. That follows from
the revision-key design above; it is not something this restart demonstrates.

If the database is stopped instead, the API reports 503, including on a
cached read. That follows our source-of-truth decision from chapter 2.
An application that deliberately serves stale data during outages would
need a different contract and clear user-facing semantics.

## Replace the cache, keep the records

Recreate only Redis and refresh the reading list:

```text
docker compose -p ark-reading -f compose.yaml -f compose.cache.yaml up -d --force-recreate --wait cache
```

The edited records should still match Postgres, while the next uncached
read repopulates Redis. Losing the cache means losing reusable work;
losing the database volume would mean losing the source records.
Keep the overlay for [development](05-develop-and-rebuild.md).

To return to the three-service version later, start the base description and
remove the now-unneeded cache as an orphan **within this project**:

```text
docker compose -p ark-reading -f compose.yaml up -d --wait --remove-orphans
```

There is no cache backup task here, because recovery comes from Postgres.
Explain that choice to someone proposing a second named volume for Redis.
