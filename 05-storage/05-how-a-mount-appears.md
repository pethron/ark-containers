---
title: "How a mount appears inside the container"
track: architecture
---

# How a mount appears inside the container

The notes survived replacement and a restore because the service kept writing
to storage outside its own writable layer. Inside the application the path
was still `/data/notes.txt`, though. Let's compare Docker's description of
that mount with what the process can see, then use the owner to explain why
the same image failed at `/srv/notes`.

## Follow `/data` from both sides

The previous chapter left `ark-notes` running with `ark-notes-data` mounted
at `/data`. First ask Docker which mounts it configured:

```text
docker inspect --format '{{json .Mounts}}' ark-notes
```

Find the entry with `"Type":"volume"`, the volume name and
`"Destination":"/data"`. `"RW":true` says this mount permits writes; it
doesn't by itself give every process permission to write every file.

Now ask a process inside the same container for the kernel's mount information:

```text
docker exec ark-notes grep ' /data ' /proc/self/mountinfo
docker exec ark-notes ls -ldn /data /data/notes.txt
docker exec ark-notes id
```

The mount table has a row whose mount point is `/data`; its other fields and
source path depend on the engine. The numeric listing should show UID and GID
`1000`, matching the `ark` process in `id`. Together with the directory's
permissions, that ownership lets the service create and update its notes.
The HTTP response at `http://127.0.0.1:8080/notes` is the application-level
check that the path actually contains the notes.

Docker's inspection describes the mount requested for the container. The
mount table describes what a process sees in its mount namespace. A mount
can hide the image's original path without deleting its files, and two
different containers can mount the same volume at different paths.

## Why the owner mattered

In the earlier `/srv/notes` experiment, a new volume initially had no
prepared directory to copy from the image. It appeared owned by root, and
the ordinary `ark` process couldn't create the notes file there. At `/data`,
the image prepared an `ark`-owned directory, which Docker copied into the
empty volume. Existing volume data keeps its existing ownership; changing
the image doesn't silently repair it.

For a bind mount, the source belongs to the engine host or to the host file
sharing provided by Docker Desktop. Ownership, permissions and performance
can differ between native Linux and Desktop's managed Linux environment.
Inspect and test the actual source and receiving platform instead of
assuming that a writable mount grants `ark` access.

## Decide what to keep

You've checked the original volume and restored its backup. When you're
finished, decide whether to keep that data and archive. If you no longer need
the notes from this walkthrough, remove only its named resources:

```text
docker stop ark-notes
docker rm ark-notes
docker volume rm ark-notes-data
docker image rm ark-notes:v1
```

Removing the volume deletes its notes. Keep `notes-backup.tar` in your backup
folder if you want to retain the copy, and leave unrelated volumes alone.
The [notes migration kata](katas/README.md) starts with its own data and asks
you to diagnose a different owner.
