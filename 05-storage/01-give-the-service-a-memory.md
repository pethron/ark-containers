---
title: "Persisting data with volumes"
track: runbook
pagination_prev: 05-storage/README
---

# Persisting data with volumes

Up to now, our service has had nothing to remember. It answered with a
message and a health check, and we could throw its container away and start
a new one whenever a setting or the code changed. In this module the service
gets something it does need to remember, and replacing the container, which
is how we deploy every change, must stop costing us that memory.

We'll start from a version of our service that keeps notes in a file. First
we'll lose them by replacing the container, then we'll give them a place that
outlives it. By the end of the chapter, you'll be able to replace the
container and find your notes waiting in the new one.

## What the notes service adds

You need Docker running Linux containers, as set up in module 01, and either
a browser or curl for the HTTP checks. Adding a note sends a small request
with curl, which Windows 10 and later include as `curl.exe`. On Linux Engine,
prefix Docker commands with `sudo` if your setup requires it.

The chapter uses the image `ark-notes:v1`, a container named `ark-notes`,
a volume named `ark-notes-data` and local port `8080`. Check `docker ps -a`,
`docker volume ls` and `docker image ls ark-notes` before starting. The
container name, image tag and volume name must be available, and the volume
must start empty. If any belong to another task, choose unused names and use
them consistently throughout this module; don't delete existing data to make
the exercise work. If port 8080 is occupied, choose a free loopback host port
for the main service and use it in the module's mappings and URLs. Check the
second port separately when an exercise starts another service. From the
[root of your course checkout](../before-you-start.md#get-the-course-files),
move into the supplied example:

=== "Linux (Bash)"

    ```bash
    cd 05-storage/notes-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\05-storage\notes-service
    ```

Run the commands in this chapter from that directory.

Open `app.py`. It's a small web service written with Python's standard
library and listening on port 8000 inside the container. A request to `/`
answers with a message, which the `MESSAGE` environment variable can change,
and with `served_by`, the hostname of the container that answered; `/health`
answers `{"status": "ok"}`. On top of those, a `POST` request to `/notes`
saves the request body as a note, and a `GET` request to `/notes` lists
everything saved so far. The notes go into a plain text file, one per line,
at `/data/notes.txt` inside the container.

Now open the `Dockerfile`, the recipe that builds the image:

```dockerfile
FROM python:3.12-alpine

RUN adduser -D ark && mkdir /data && chown ark:ark /data

WORKDIR /app
COPY --chmod=644 app.py /app/app.py

USER ark

CMD ["python", "/app/app.py"]
```

The image starts from the official Python image on Alpine Linux, copies
`app.py` into `/app` and starts it with `python` as the `ark` user. The code
stays owned by root, and `--chmod=644` lets every user read it while only
root may change it, so the service can't modify the code it runs.

The `RUN` line prepares the account and its data directory. `adduser -D ark`
creates `ark`, an ordinary account without a password, and the `&&` runs the
next command only if the previous one succeeded. The build then creates the
`/data` directory, and `chown` gives it to `ark`: the first `ark` names the
owner, the second the group. Notes are different from code, because writing
them is the service's job, so the recipe prepares one directory where `ark`
is allowed to create files and keeps the rest of the image read-only for it.

Build the image:

```text
docker build -t ark-notes:v1 .
```

The build downloads `python:3.12-alpine` if your engine doesn't have it yet,
so it needs a network connection, and finishes with
`naming to docker.io/library/ark-notes:v1`.

## Lose the notes

Let's begin without any storage setting. Start the service in the background
with `-d`, publishing its port 8000 on port 8080 of your computer's loopback
address, so only your own machine can reach it:

```text
docker run -d --name ark-notes -p 127.0.0.1:8080:8000 ark-notes:v1
```

Add a note. The `-d` option makes curl send a `POST` request with the text
that follows as its body:

=== "Linux (Bash)"

    ```bash
    curl -d "Water the plants" http://127.0.0.1:8080/notes
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -d "Water the plants" http://127.0.0.1:8080/notes
    ```

The answer, `{"saved": "Water the plants", "notes": 1}`, confirms the note
and how many the service now holds. If curl can't connect, the service is
still starting: wait a second and retry. Open `http://127.0.0.1:8080/notes` in your
browser to read the list. Add a second note of your own if you like.

Before going further, write down a prediction. We'll stop and start this
container, and then replace it with a new one from the same image. After
each step, will `/notes` still show your notes?

```text
docker stop ark-notes
docker start ark-notes
```

Reload `/notes`: your notes are still there. Now replace the container,
as you would to deploy a new version or change a launch setting:

```text
docker stop ark-notes
docker rm ark-notes
docker run -d --name ark-notes -p 127.0.0.1:8080:8000 ark-notes:v1
```

Reload `/notes` once more, and you'll find an empty list, `{"notes": []}`.
The service wrote `notes.txt` into the container's writable filesystem,
which Docker gives every container on top of the files from its image.
That filesystem belongs to one container: it lasts through stops and starts
and goes away when Docker removes the container. The new container started
from the image again, and the image has an empty `/data`.

## Keep the notes in a volume

To survive replacement, the notes need to live somewhere whose lifetime
doesn't depend on any particular container. Docker provides that place as
a **volume**: storage that Docker creates and manages on its own, under a name
you choose, and that you attach to a container at a path of your choice.
The container reads and writes that path as usual, while the files land in
the volume. When the container goes, the volume stays, ready for the next one.

Remove the container without a volume:

```text
docker stop ark-notes
docker rm ark-notes
```

Then start the service again, this time asking Docker to mount a volume
named `ark-notes-data` at `/data`:

```text
docker run -d --name ark-notes -p 127.0.0.1:8080:8000 --mount type=volume,source=ark-notes-data,target=/data ark-notes:v1
```

The `--mount` option attaches storage to the container at a path. Its `type`
says what kind of storage: `type=bind`, which you may have used to bring a
file from your computer, would show a host path, while `type=volume` asks for
a Docker volume. `source` names the volume, and `target` is the path where it
appears inside the container. If no volume with that name exists, Docker
creates it, so this command also prepared the storage. The command has no
host paths, so it's the same in Bash and PowerShell.

Add a note:

=== "Linux (Bash)"

    ```bash
    curl -d "Water the plants" http://127.0.0.1:8080/notes
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -d "Water the plants" http://127.0.0.1:8080/notes
    ```

Open `http://127.0.0.1:8080/` and write down the `served_by` value, then
replace the container exactly as before:

```text
docker stop ark-notes
docker rm ark-notes
docker run -d --name ark-notes -p 127.0.0.1:8080:8000 --mount type=volume,source=ark-notes-data,target=/data ark-notes:v1
```

Reload `/notes`: `Water the plants` is back. Open `http://127.0.0.1:8080/`
too and compare `served_by` with the value you wrote down. It has changed,
because this is a brand-new container with a new ID and hostname. The notes
reached it because the replacement mounted the same volume.

<details>
<summary>The container exits right after starting</summary>

Check `docker ps -a` and `docker logs ark-notes`. A line such as
`Cannot write notes file /data/notes.txt: Permission denied` means `ark`
can't write in the directory mounted at `/data`. Check that `target=/data`
is spelled exactly like that, and that the volume name is one you haven't
used for another experiment: an existing volume keeps whatever owner and
files it already has. We'll diagnose this kind of failure properly in
the chapter on choosing mounts.

</details>

## Why ark can write into the volume

Our recipe made `/data` writable for `ark`, but the volume is a separate
piece of storage that Docker created at launch. So how did `ark` get
permission to write there? Ask the running container:

```text
docker exec ark-notes ls -ld /data
```

The owner and group columns show `ark`. When Docker mounts an **empty volume**
at a path where the image already has a directory, it first copies that
directory's contents into the volume, along with their owners and permissions.
Our image had an empty `/data` owned by `ark`, so the new volume received that
owner. The copy happens only while the volume is empty: once it contains
notes, Docker leaves it alone and every later container sees the data as it
is. Keep that rule in mind, because the next chapter shows what happens when
the image has nothing to copy.

## What changed in the handover

Before it kept notes, everything a colleague needed to run our service was
the image and a few launch settings. That's still true for the code, and the
image still contains no notes, which is exactly what we want: a new version
can replace it without touching anyone's data. The launch settings now include
one more decision, the volume that holds the notes, and the volume itself
becomes something to keep, inspect and protect.

| | Service without notes | Notes service with a volume |
|---|---|---|
| Code | In the image | In the image |
| Message and port | Launch settings | Launch settings |
| Data written by the service | None | Notes in `ark-notes-data`, mounted at `/data` |
| Effect of replacing the container | Nothing to lose | Notes stay in the volume |

Leave `ark-notes` running on port 8080 with its notes in `ark-notes-data`.
The next chapter compares mounts and keeps that volume for the backup.
