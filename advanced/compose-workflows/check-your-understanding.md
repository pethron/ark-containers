# Check your understanding

Answer from the experiments before reopening the configuration. Explain the
observation you would use to check each answer; command names alone are
not enough evidence.

1. The HTML page loads but `/api/books` returns Nginx HTML 502. Which boundary
   would you inspect first, and what would API JSON 404 suggest instead?
2. Why can the API call `db:5432` without a database host publication, while
   the browser cannot call `api:8000` directly?
3. Postgres is running, but Compose won't start the API. Which condition is
   being tested, and how could the probe be wrong even if the server works?
4. After startup, Postgres stops. Who retries connections, what bounds that
   retry, and why should an uncertain write not be blindly replayed?
5. What does changing `POSTGRES_PASSWORD_FILE` do to a database that was
   already initialized? Which image-documentation section supports your answer?
6. Records survive `down/up`. Which failure remains uncovered, and what
   application-level result would establish successful recovery from a dump?
7. Why write a custom-format dump inside the container and copy its file,
   rather than redirecting binary output through every host shell?
8. Redis returns after an edit it couldn't invalidate. How does the database
   revision prevent selection of the old entry? Which database queries remain
   even on a cache hit?
9. Watch updates a source file without rebuilding. What causes the running
   Python process to use it, and when does that source become part of an image?
10. A dependency edit rebuilds the API. Which two checks distinguish a real
    rebuild from a source sync, and what keeps the proxy working after a
    changed API address?
11. Two projects use the same source. Which names and storage boundaries keep
    their records separate, and which port must differ to run both entry points?
12. What would your cleanup erase with and without `--volumes`? Name the
    project before proposing the command.

<details>
<summary>Compare the model after making your predictions</summary>

Nginx serves static files and proxies a prefixed path; API JSON confirms the
request reached an application route. Docker's project networks resolve
service names, while loopback publication provides the host entry point.
Healthchecks gate startup and report later conditions, but the API owns its
bounded reconnection and explicit errors. Database initialization settings
apply to an empty data directory rather than rotating an existing password.

The named volume outlives containers, and a separate logical backup covers
loss of that storage. Recovery requires matching records through a distinct
project's API. File-based transfer preserves archive bytes across shells.
Redis holds expendable query results under revision keys; Postgres remains
the durable source and supplies a revision check on every read.

Watch sync plus restart updates imported source, while a manifest edit
rebuilds and replaces the API with installed dependencies. Building again
from chosen source records that change in an image. Dynamic Nginx upstream
resolution follows service DNS changes. Project-scoped networks and named
volumes separate data; adjacent host ports separate concurrent entry points.
`down` retains named volumes, while `down --volumes` removes this project's
declared volumes too.

</details>

After a few days, revisit questions 3, 6 and 10 without your notes. Then
choose one failure from the [kata](katas/README.md), predict its evidence,
and compare your explanation with the actual response and logs.
