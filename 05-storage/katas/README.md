---
title: "Notes from the old release"
track: kata
---

# Notes from the old release

It's Friday afternoon, and the operations team is about to move the notes
service to your new image. The release they run today ran as root, and every
note it saved sits in a volume called `ark-kata-notes`. They plan to replace
the old container with one from `ark-notes:v1` and mount the same volume.
Their only requirement is that nobody loses a note, and they'd like proof
before the weekend.

## Before you start

You need Docker running Linux containers and curl; on Windows, call it as
`curl.exe`. On Linux Engine, prefix Docker commands with `sudo` if your setup
requires it. The kata uses the image `ark-notes:v1` from this module's notes
service, which runs as the `ark` user and keeps its notes in
`/data/notes.txt`, or in the file named by `NOTES_FILE`. From the root of
your course checkout, build it:

=== "Linux (Bash)"

    ```bash
    cd 05-storage/notes-service
    docker build -t ark-notes:v1 .
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\05-storage\notes-service
    docker build -t ark-notes:v1 .
    ```

The tasks create the containers `ark-kata` and a restored service, and the
volumes `ark-kata-notes` and `ark-kata-restored`. If any of those exist from
an earlier attempt, remove them first, starting with the containers. Publish
`ark-kata` on `127.0.0.1:8080` and the restored service on `127.0.0.1:8081`,
so those local ports must be free; if your requirement experiment runs
alongside them, give it `8082`. The tasks use only the notes service, so the
work stays on containers and storage rather than application code.

## Recall what survives

Without opening the chapters, fill in this table for the notes service: does
a note survive each operation when it's stored in the writable layer, in a
named volume and in tmpfs?

| Operation | Writable layer | Named volume | tmpfs |
|---|---|---|---|
| Stop, then start | | | |
| Replacement | | | |
| `docker volume rm` of the volume | | | |

Check any two cells you're unsure of with a quick experiment and correct
your answers. Then write down, in a sentence, when Docker copies files from
the image into a volume.

## Set up the old release's data

This command plays the old release: a container running as root writes a
note into the volume, exactly as the old service would have done. It has no
host paths, so it's the same in Bash and PowerShell:

```text
docker run --rm --mount type=volume,source=ark-kata-notes,target=/data python:3.12-alpine sh -c "echo Kept since the first release > /data/notes.txt"
```

Treat `ark-kata-notes` as the team's production data from now on: don't
delete or recreate it to make a problem go away.

## Move the notes to the new release

Start `ark-notes:v1` as a container named `ark-kata`, published on
`127.0.0.1:8080`, with `ark-kata-notes` mounted at `/data`. It won't work at
first. Find out why, and fix it so that all of these are true:

- `ark-kata` runs from the unchanged `ark-notes:v1` image, and its server
  process runs as `ark`.
- `/notes` lists `Kept since the first release`, and a new note you add is
  saved and still listed after the container is replaced.
- No container keeps running as root after the fix, and the volume still
  holds the original note.

Write down the evidence that led you to the cause before you change anything.

<details>
<summary>Hint 1: where to look</summary>

The container's state and its logs come first, as always. Which path does
the error name, and which account is trying to write there?

</details>

<details>
<summary>Hint 2: who owns the data</summary>

A container that only runs `ls -ln /data` with the same volume mounted shows
the numeric owners. Which ID does `ark` have in our image? Then think about
when Docker copies the image's `/data`, and its owner, into a volume: why
didn't that give `ark` ownership of this one?

</details>

<details>
<summary>Hint 3: a maintenance task</summary>

The data needs new owners once, while the service should keep running as
`ark`. A one-off container can run with a different user from the image
default: `docker run --user` sets it for that container only. Which user may
change a file's owner, and which command in the notes service's `Dockerfile`
does it?

</details>

## Prove it can be restored

Before telling the team the move is done, give them a backup they can trust.
Using the procedure from [chapter 04](../04-back-up-and-restore-the-notes.md)
as a reference:

- Archive `ark-kata-notes` into a backup folder outside the course checkout,
  while `ark-kata` is stopped.
- Restore the archive into a new volume, `ark-kata-restored`, and run a second
  service from it on `127.0.0.1:8081`.
- Show through that service that both the original note and your new note
  are present, and that it accepts one more note.
- Show that `ark-kata` doesn't have the note written to the restored copy.

## A different requirement

The team has three more requests for future services. Choose one, or a
similar requirement from a service you know:

- A demonstration instance for training sessions that must start with no
  notes every time it starts, even after a stop.
- Notes that an administrator reads and edits directly in a folder on the
  host machine, a Linux server.
- A file holding a short-lived access token that should never be written to
  the engine's disk.

Choose a volume, a bind mount or tmpfs and justify the choice in a few
sentences: where the files live, how long they last, who owns them and what
could go wrong. Then run the notes service with your choice, using
`NOTES_FILE` and a mount, and show the behavior the requirement asks for.
If your choice depends on the host's permissions or on a setting such as
`tmpfs-mode`, state which values you used and why.

<details>
<summary>Hint: the trade-off behind each option</summary>

Look at the comparison table in
[chapter 03](../03-choose-a-volume-bind-mount-or-tmpfs.md#choosing-a-mount).
For a bind mount on Linux, think about which numeric owner the host folder
has and which one `ark` uses. For tmpfs, Docker's documentation warns that the
host can move memory pages to swap space on disk; is that acceptable for
your requirement?

</details>

## Review and reset

Explain your diagnosis to a peer, or write it down for yourself: what you
observed, what you concluded from each observation and why your fix keeps
the service as `ark`. If you work with someone else, compare your storage
choice for the last task with theirs. Two different choices can both be
reasonable when the justification holds.

Then remove only what this kata created: the `ark-kata` container and the
restored service, the `ark-kata-notes` and `ark-kata-restored` volumes, any
container or volume from your requirement experiment, the `ark-notes:v1`
image if you no longer need it, and the archive in your backup folder. Check
the names with `docker ps -a` and `docker volume ls` before removing anything,
and leave other volumes alone.

At the next study session, predict what `docker diff` would show for a
service that keeps all its data in a volume, then check it on a new container.
After that, move on to [networking](../../06-networking/README.md), where a
service will need to talk to a second one without exposing it to the whole
machine.
