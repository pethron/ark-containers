---
title: "Database persistence, backup and restore"
track: runbook
---

# Database persistence, backup and restore

The database was unavailable for a moment, and the API recovered without
losing the reading list. Next, let's replace the containers entirely and
then prepare for a different problem: recovering the records when their
original volume is unavailable. Those two tasks need different evidence.

Use the base stack in `application`, with the default `reading` database
and user from `.env`. From a fresh setup, start chapter 1 and add at least
two distinctive titles. Keep the cache off until the next chapter.

## Verify the storage boundary

Recall the writable-filesystem exercise from core storage: a file inside a
replacement container starts from the image again unless its storage lives
elsewhere. Here `records` mounts at Postgres 17's documented data path.
Compose names it `ark-reading_records`, and a replacement database container
reattaches it under the same project name.

Record the current titles and IDs through the UI or `/api/books`. The next
command recreates database and API containers; brief request failures during
replacement are expected. Wait for health, then compare the saved records:

```text
docker compose -p ark-reading up -d --force-recreate --wait db api
docker compose -p ark-reading down
docker compose -p ark-reading up -d --wait
```

Refresh the UI and check `/api/books` again. Matching records verify that
container recreation and `down` preserved the volume. This volume is still
on the same Docker engine, so it does not protect against deletion of that
volume or loss of the machine. **Persistence and backup answer different
failure questions.**

## Make a logical backup without changing its bytes

Postgres provides [`pg_dump`](https://www.postgresql.org/docs/17/app-pgdump.html)
to take a consistent logical database snapshot
while the server is running. Its custom archive format works with
[`pg_restore`](https://www.postgresql.org/docs/17/app-pgrestore.html); copying
the live database directory would need a different
physical-backup procedure and is outside this exercise.

The dump goes to a file **inside the database container**, and `docker cp`
copies the file to `backups` on your computer. This avoids passing binary
archive bytes through shell redirection, whose behavior varies across
PowerShell versions. The path below is outside the mounted Postgres data
directory, so treat the host copy as the artifact to keep.

Pause writes from the UI while comparing this snapshot with the later
restore. Readers can continue, but a book added after the dump belongs to
a later database state. `-U reading` selects the database role and
`-d reading` selects the database. `ps -q db` gives us the current container
ID for the copy, so we don't need to assume its generated name.

=== "Linux (Bash)"

    ```bash
    docker compose -p ark-reading exec -T db pg_dump -U reading -d reading -Fc -f /var/lib/postgresql/reading.dump
    db=$(docker compose -p ark-reading ps -q db)
    docker cp "${db}:/var/lib/postgresql/reading.dump" backups/reading.dump
    ls -l backups/reading.dump
    curl http://127.0.0.1:8080/api/books
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker compose -p ark-reading exec -T db pg_dump -U reading -d reading -Fc -f /var/lib/postgresql/reading.dump
    $db = docker compose -p ark-reading ps -q db
    docker cp "${db}:/var/lib/postgresql/reading.dump" .\backups\reading.dump
    Get-Item .\backups\reading.dump
    curl.exe http://127.0.0.1:8080/api/books
    ```

`-T` disables allocation of a terminal for the tool; `-Fc` selects the
custom archive format and `-f` writes its file directly. The database
image's local socket authentication permits this local tool invocation.
A non-empty host file proves a file was copied, but recovery is what will
tell us whether it is useful. Dumps contain application data, so keep real
backups private even though this fixture ignores the directory in Git.

## Recover into a distinct empty project

Check that `ark-reading-restore` is unused and port 8081 is available. Start
the base stack under that name; Compose gives it another volume and networks,
while the environment override changes only its entry port. Do not reuse a
project that already holds records: the restore command below replaces its
schema.

=== "Linux (Bash)"

    ```bash
    WEB_PORT=8081 docker compose -p ark-reading-restore up -d --build --wait
    curl http://127.0.0.1:8081/api/books
    restore_db=$(docker compose -p ark-reading-restore ps -q db)
    docker cp backups/reading.dump "${restore_db}:/var/lib/postgresql/reading.dump"
    docker compose -p ark-reading-restore exec -T db pg_restore -U reading -d reading --clean --if-exists --no-owner --exit-on-error /var/lib/postgresql/reading.dump
    curl http://127.0.0.1:8081/api/books
    ```

=== "Windows (PowerShell)"

    ```powershell
    $env:WEB_PORT = "8081"
    docker compose -p ark-reading-restore up -d --build --wait
    curl.exe http://127.0.0.1:8081/api/books
    $restoreDb = docker compose -p ark-reading-restore ps -q db
    docker cp .\backups\reading.dump "${restoreDb}:/var/lib/postgresql/reading.dump"
    docker compose -p ark-reading-restore exec -T db pg_restore -U reading -d reading --clean --if-exists --no-owner --exit-on-error /var/lib/postgresql/reading.dump
    curl.exe http://127.0.0.1:8081/api/books
    Remove-Item Env:\WEB_PORT
    ```

Before restore, the new API must return an empty `books` array. The normal
initialization has created an empty schema there; `--clean --if-exists`
removes those supplied objects before restoring the archive's objects.
`--no-owner` keeps ownership with the restoring role, and `--exit-on-error`
makes failures visible. These flags are suitable for our distinct empty
exercise target, not permission to overwrite your working project.

Compare the IDs and titles with the snapshot, including any accented
characters you added. Then add a book at port 8081 only and reread port 8080.
The first list should be unchanged. That gives us both **application-level
recovery evidence** and proof that the two projects have isolated storage.
The database starting successfully, or `pg_restore` exiting successfully,
would each be weaker checks on their own.

## Keep the working list and scope the reset

The restore project's records are disposable once you have checked recovery.
Remove only that project and its volume, and retain the host dump if you want
to reuse it:

```text
docker compose -p ark-reading-restore down --volumes
```

The main project still owns the original list. If a restore fails, keep
its error, confirm the selected project and database, and inspect the archive
with `pg_restore --list` inside the target container before trying again.
Resetting the disposable target is reasonable; deleting the source volume
to debug a restore is not.

What would your handover need to say about snapshot time, database major
version and the target being empty? Keep that question for chapter 6.
Next we'll [cache repeated reads](04-add-a-disposable-cache.md) without giving
another service responsibility for the durable records.
