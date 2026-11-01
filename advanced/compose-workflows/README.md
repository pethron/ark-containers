# Compose in practice: the reading list

Your team has a reading list, and people expect it to survive more than the
container that first saved it. They also want to edit the application without
repeating a build after every source change. Here you'll run a supplied
application, recover its records into another stack, and prepare a handover
someone else can check.

This second part of the Compose module puts the small stack's lessons to work
on an application with a database, alongside the build, storage and networking
skills from earlier modules. It starts from its own files and creates its own
resources, so the small stack can stay as you left it. You need Docker running
Linux containers, a Compose version supporting `sync+restart` and `initial_sync`
(2.32 or later), an editor, and a browser or curl. The first build downloads
images and Python packages, but Python runs inside the supplied image. No
local Python installation, registry account or cloud service is needed.

The first stack is `browser -> Nginx -> API -> Postgres`. Nginx serves the UI
and forwards `/api/` requests to a non-root API. Postgres owns the records in a
named volume; an optional Redis overlay later caches repeated reads. Only
Nginx publishes a host port, on loopback. The configuration is a local learning
environment with plain HTTP, a dummy database credential and a database
superuser for simplicity, rather than a production security baseline.

## Work through the application

1. [Running a multi-service stack](01-run-the-application-stack.md):
   add a book and follow its request through all three services.
2. [Configuration, secrets and readiness](02-configuration-and-readiness.md):
   infer settings from image documentation and distinguish startup gates from
   continuing availability.
3. [Database persistence, backup and restore](03-persistence-backup-and-restore.md):
   replace containers, then recover a logical backup into a distinct project.
4. [Adding a Redis cache](04-add-a-disposable-cache.md):
   observe hits, edit a record, and verify freshness when Redis disappears.
5. [Developing with Compose Watch](05-develop-and-rebuild.md):
   use Watch for source changes and dependency rebuilds without losing data.
6. [Troubleshooting and handover](06-diagnose-and-hand-over.md):
   separate routing from dependency failures and write an evidence-based runbook.

After the guided work, take on the [independent kata](katas/README.md) and the
[self-checks](check-your-understanding.md). If you only need the commands,
the module's [fast track](../../07-compose/fast-track.md) runs the same
application from the first request to a live code change in one page. CI/CD, automatic deployment and
Kubernetes are outside this course.

## Start from a clean directory, not a running core lab

From the **[course checkout root](../../before-you-start.md#get-the-course-files)**, enter the supplied application directory.
The commands below reserve project `ark-reading` and port 8080. Before using
that name, run `docker compose ls` and check `docker ps` for existing published
ports. If someone already owns the name or port, choose your own project name
and set `WEB_PORT` in `.env`, then use those values consistently.

=== "Linux (Bash)"

    ```bash
    cd advanced/compose-workflows/application
    cp secrets/db-password.example secrets/db-password.txt
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\advanced\compose-workflows\application
    Copy-Item .\secrets\db-password.example .\secrets\db-password.txt
    ```

Copy the dummy file only on first setup; do not overwrite a credential you
already use. The real filename is ignored by this fixture's Git rules and
excluded from image build contexts. On a native Linux host, the non-root API
must be able to read the file through the bind mount; the dummy example normally
inherits readable permissions. Do not make genuine credentials world-readable
to solve an access problem. Local Compose file secrets provide service-specific
mounts, not encryption or a managed secret store.

Keep terminals for later chapters in this directory. If you return with a new
checkout, repeat this setup and chapter 1, then start the overlay required by
the chapter you're following. The chapters do not depend on leftover core
containers or volumes.

## Files you can inspect

`compose.yaml` is the image-only runtime description. The `api`, `db`, `proxy`
and `ui` directories supply original code, schema, Dockerfiles and routing.
`compose.cache.yaml` adds Redis, while `compose.dev.yaml` adds Watch rules.
The deliberate readiness fault and delayed initialization each have a separate
overlay, so neither changes the normal startup path. `tests` contains supplied
unit tests run in containers.

The fixture pins `python:3.13.7-slim`, `postgres:17.6-alpine`,
`nginx:1.28.0-alpine` and `redis:7.4.5-alpine`. A patch tag makes the intended
version visible; a tag can still be republished, so it is not an immutable
digest or a promise that these patches remain the latest security releases.
These versions are exercise inputs, not an unattended update policy.

## Sources and boundaries

The technical references are the maintained
[Postgres image documentation](https://hub.docker.com/_/postgres),
[Redis image documentation](https://hub.docker.com/_/redis),
[Nginx image documentation](https://hub.docker.com/_/nginx),
[Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/),
[file secrets](https://docs.docker.com/compose/how-tos/use-secrets/) and
[Watch](https://docs.docker.com/compose/how-tos/file-watch/).
Chapter 2 turns image reading into a task, rather than treating image names as
enough information to run a backing service.

Application integration, documentation-reading and independent development
practice were teaching inspiration from the University of Helsinki's
[DevOps with Docker](https://courses.mooc.fi/org/uh-cs/courses/devops-with-docker-fall-2026).
This part's narrative, exercises, code and configuration are original ARK
material; that course's deployment and daemon-access examples are not used here.
