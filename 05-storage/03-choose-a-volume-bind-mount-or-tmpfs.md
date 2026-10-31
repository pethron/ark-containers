---
title: "Volumes, bind mounts and tmpfs"
track: runbook
---

# Volumes, bind mounts and tmpfs

The notes have found a good home in a volume, but they aren't the only
files a service ever touches. While you develop it, you want the container
to run the code you're editing right now, without a rebuild after every
change. Some files should vanish as soon as the container stops. And sooner
or later someone will ask for the data to live at a different path.

Docker offers three kinds of mount for these needs, and in this chapter we'll
use each of them with the notes service: a bind mount for code under
development, tmpfs for throwaway files, and a volume at a new path, which will
also give us a permission problem to diagnose. You'll finish with a way to
choose between them for the next service you run.

The service in the image listens on port 8000, keeps notes in `/data/notes.txt`
or in the file named by the `NOTES_FILE` environment variable, and runs as
`ark`, an ordinary account that owns `/data` and nothing else in the image.

## A bind mount for code you're editing

A **bind mount** makes a file or directory from your computer appear inside
the container. It's the handiest way to try code changes without building a
new image each time. We'll mount the whole
`notes-service` directory over `/app`, read-only, so the container runs the
copy of `app.py` in your editor. The previous chapter removed the service
container but kept `ark-notes-data`; check that `ark-notes-dev` and local port
8080 are free before this first experiment:

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-notes-dev -p 127.0.0.1:8080:8000 \
      --mount "type=bind,source=$(pwd),target=/app,readonly" \
      ark-notes:v1
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-notes-dev -p 127.0.0.1:8080:8000 `
      --mount "type=bind,source=$($PWD.Path),target=/app,readonly" `
      ark-notes:v1
    ```

Mounting the directory rather than the single file keeps the container in
step with editors that save by writing a new file and renaming it, which a
single-file mount can miss. The mount hides the image's `/app` completely,
so the code running here comes from your computer. `readonly` keeps the
service from changing your source.

Open `app.py`, change the default message `Hello from ARK` to a text of your
own and save the file. Python reads the code only when it starts, so restart
the container and reload `http://127.0.0.1:8080/`:

```text
docker restart ark-notes-dev
```

The new message appears without a rebuild. That convenience is exactly what
we give up when we copy the code into the image so that it travels as one
piece, and it's why bind mounts belong on a developer's machine, while the
image remains what you deliver.
Change the message back to `Hello from ARK`, save, and remove the container:

```text
docker stop ark-notes-dev
docker rm ark-notes-dev
```

> 💡 A bind mount shows whatever the host has at that path, with the host's
> rules. On Linux Engine, the container sees the real owners and permissions
> of your files, so whether `ark` may write there depends on your account
> and your directory's permissions. Docker Desktop passes your Windows or
> macOS folders through a file-sharing layer with rules of its own: on Windows,
> for example, shared folders appear owned by root, yet any container user can
> create files in them. Shared folders also inherit host habits such as
> case-insensitive file names and, on Windows, CRLF line endings in files
> edited there. A data directory that works on one laptop can therefore fail
> on another. That's one more reason to keep service data in volumes, which
> behave the same wherever the engine runs.

## tmpfs for files that should disappear

Sometimes losing files is the goal: a test instance that must start clean
every time, or temporary files you'd rather never write to disk. A **tmpfs**
mount keeps its files in the memory of the machine running the containers,
and Docker discards them when the container stops. Let's put the notes there
to see the difference. After removing the bind-mount container, check that
`ark-notes-scratch` and port 8080 are free:

```text
docker run -d --name ark-notes-scratch -p 127.0.0.1:8080:8000 --mount type=tmpfs,target=/data,tmpfs-mode=1777,tmpfs-size=1m ark-notes:v1
```

The two extra settings need a word. A new tmpfs mount belongs to root, and
`tmpfs-mode=1777` sets its permissions so that `ark` can write: `777` lets
every user read, write and enter it, and the leading `1` stops users from
deleting each other's files, the same arrangement as `/tmp`. Docker's reference
describes this mode as the default, but the engine used to test this course
(Docker 29) created a mount only root could write, so state the mode you need
instead of relying on the default. `tmpfs-size=1m` caps the mount at one
megabyte; because the files live in memory, they also count against any
memory limit you set for the container.

Add a note, check it, then stop and start the container:

=== "Linux (Bash)"

    ```bash
    curl -d "Scratch note" http://127.0.0.1:8080/notes
    curl http://127.0.0.1:8080/notes
    docker stop ark-notes-scratch
    docker start ark-notes-scratch
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -d "Scratch note" http://127.0.0.1:8080/notes
    curl.exe http://127.0.0.1:8080/notes
    docker stop ark-notes-scratch
    docker start ark-notes-scratch
    ```

Reload `http://127.0.0.1:8080/notes` and the list is empty. Without a mount,
the note would have survived the same stop and start in the container's
writable layer, which lasts as long as the container exists. A tmpfs mount
lasts only while the container runs, the shortest lifetime of the three.
Remove the container before moving on:

```text
docker stop ark-notes-scratch
docker rm ark-notes-scratch
```

## A volume at a new path

Here's a request you might well receive. The team that will run the service
keeps every application's data under `/srv`, and their backup tooling expects
the notes in `/srv/notes`. The application already lets you choose the file
through the `NOTES_FILE` environment variable, so the launch looks
straightforward: point the variable at the new path and mount a new volume
there. Check that container `ark-notes-srv` and local port 8080 are free.
The volume `ark-notes-srv` must be new for this experiment; if it already
exists, inspect it and choose a different name, updating the commands below,
rather than deleting data you may need.

Before running it, predict whether `ark` will be able to write the notes.

```text
docker run -d --name ark-notes-srv -p 127.0.0.1:8080:8000 -e NOTES_FILE=/srv/notes/notes.txt --mount type=volume,source=ark-notes-srv,target=/srv/notes ark-notes:v1
```

Open `http://127.0.0.1:8080/health` and the request fails. Start the diagnosis
with the container's state and its logs:

```text
docker ps -a --filter name=ark-notes-srv
docker logs ark-notes-srv
```

The container has `Exited (1)`, and the log explains why:
`Cannot write notes file /srv/notes/notes.txt: Permission denied`. The service
checks at startup that it can save notes and refuses to run otherwise, which
is kinder than accepting notes it would lose. So who owns the volume?
A container that only lists the directory and exits answers the question:

```text
docker run --rm --mount type=volume,source=ark-notes-srv,target=/srv/notes ark-notes:v1 ls -ld /srv/notes
```

The directory belongs to root, with `rwxr-xr-x` permissions, so `ark` may
read it but can't create files. Here's the rule that explains it: when Docker
mounts an empty volume at a path where the image already has a directory, it
first copies that directory's contents into the volume, owner and permissions
included. That's how the image's `ark`-owned `/data` makes a new volume
writable for `ark`. Our image has no `/srv/notes`, so there was nothing to
copy, and the volume kept the default owner of a new mount point, root.

You could make the error go away by running the service as root, but that
would give up the protection of running as `ark`, which can't change the
code it runs, for the sake of a single directory. The fix
belongs in the image, which should prepare the directory its service writes
to. Open `Dockerfile.srv`: it's our recipe with `/srv/notes` in place of
`/data` on the `RUN` line. `mkdir -p` also creates `/srv` if it's missing.
Build it under its own tag:

```text
docker build -f Dockerfile.srv -t ark-notes:srv .
```

Remove the failed container and start the new image with the same volume:

```text
docker rm ark-notes-srv
docker run -d --name ark-notes-srv -p 127.0.0.1:8080:8000 -e NOTES_FILE=/srv/notes/notes.txt --mount type=volume,source=ark-notes-srv,target=/srv/notes ark-notes:srv
```

This time `/health` answers, and adding a note to `http://127.0.0.1:8080/notes`
works. The volume was still empty, because the first attempt failed before
writing anything, so Docker copied the new image's `ark`-owned `/srv/notes`
into it. Had the volume already contained files, Docker wouldn't have touched
it, and you would have to correct the owners of the existing data instead.
The kata at the end of this module gives you that situation to solve.

Remove this experiment, including its volume and the extra image tag:

```text
docker stop ark-notes-srv
docker rm ark-notes-srv
docker volume rm ark-notes-srv
docker image rm ark-notes:srv
```

## Choosing a mount

Here's how the three options compare for our service:

| | Volume | Bind mount | tmpfs |
|---|---|---|---|
| Files live | In storage managed by the engine | In a host path you choose | In memory, for the running container |
| Lifetime | Until you remove the volume | As long as the host files exist | Until the container stops |
| Initial content | Copied from the image if empty | Whatever the host path holds | Empty |
| Owners and permissions | Set by the image or the data | Set by the host and its file sharing | Set at mount time with `tmpfs-mode` |
| Good for | Data the service must keep | Code and config you edit on the host | Scratch files and clean test instances |

When to use a volume: **for anything the service must keep**, like our notes.
It survives replacement, behaves the same on every engine and can be backed up
on its own. When to use a bind mount: for files that belong to you rather than
to the service, such as code under development or a configuration file you
edit on the host, mounted read-only when the service shouldn't change them.
When to use tmpfs: for files you want to lose, keeping an eye on their size
because they consume memory.

The experiments above removed the resources they created, so this chapter
leaves nothing running. Keep `ark-notes:v1` and `ark-notes-data`; the next
chapter uses that volume's note to test a backup. A volume survives
replacement, but it won't survive being deleted, a broken disk or a move to
another machine. We'll make a copy of the notes that can.
