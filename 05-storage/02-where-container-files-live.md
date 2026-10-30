---
title: "Where a container's files live"
track: architecture
---

# Where a container's files live

When the notes service writes `/data/notes.txt` into its container, the file
lasts until the container is replaced; when a volume is mounted at `/data`,
the same file moves on to the next container. From inside, the service can't
tell the difference: it opens `/data/notes.txt` both times. So where does the
file actually go, and how can you find out before a replacement teaches you
the hard way?

A container's files come from a few different sources. Let's find them with
the notes service, then follow each source through the operations you perform
every day, so you can predict what a stop, a removal or a cleanup will do to
your data.

## Ask Docker what the container changed

Docker can list the files a container has added, changed or deleted compared
with its image. To see it at work, start a second service without a volume,
next to `ark-notes`, on port 8081. Check that `ark-notes-layer` and port 8081
are free:

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-notes-layer -p 127.0.0.1:8081:8000 ark-notes:v1
    curl -d "Only in this container" http://127.0.0.1:8081/notes
    docker diff ark-notes-layer
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-notes-layer -p 127.0.0.1:8081:8000 ark-notes:v1
    curl.exe -d "Only in this container" http://127.0.0.1:8081/notes
    docker diff ark-notes-layer
    ```

`docker diff` should report two lines:

```text
C /data
A /data/notes.txt
```

`A` marks a file the container added and `C` a changed one, here the `/data`
directory that gained an entry; a `D` would mark a deletion. Now ask the
same question about the service with the volume, after adding a note
there too:

=== "Linux (Bash)"

    ```bash
    curl -d "Kept in the volume" http://127.0.0.1:8080/notes
    docker diff ark-notes
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -d "Kept in the volume" http://127.0.0.1:8080/notes
    docker diff ark-notes
    ```

This time the output is empty. The service wrote a note just like the other
one, but the write went through the mount into the volume, so the container's
own filesystem didn't change at all. That empty answer is a quick check you
can use on any container: if a service is supposed to keep its data in a
volume and `docker diff` lists data files, something is writing in the wrong
place.

## Layers, a writable layer and mounts

The files a container sees are assembled from three kinds of sources, and
the ones that matter for data can be told apart by their lifetimes.

The **image layers** come first. They hold Python, our `app.py` and the empty
`/data`, and they're read-only: every container started from `ark-notes:v1`
shares the same layers, and nothing a container does can change them.
That's why each replacement starts from the same files.

On top of them, Docker gives every container its own **writable layer**.
When the process creates a file, the file goes there; when it modifies a file
that came from the image, Docker first copies that file into the writable
layer and lets the process change the copy. This approach is called
**copy-on-write**, and it's how many containers can share one image while
each sees its own changes. `docker diff` is a listing of exactly this layer.
It belongs to one container, so it survives stop and start and disappears
with `docker rm`.

**Mounts** are placed over specific paths, hiding whatever the image had
there. A bind mount shows a file or directory from your computer, such as
source code you're editing; a volume shows storage that Docker manages. The process
writes through the mount, so those files never enter the writable layer.
You can see the mount Docker set up for `ark-notes`:

```text
docker inspect --format '{{json .Mounts}}' ark-notes
```

The output names the volume, its destination `/data`, and `"RW":true` because
the mount is writable. It also shows a `Source` path under
`/var/lib/docker/volumes`. That's where the engine keeps the volume's files.
On Docker Desktop, that path lives inside the Linux virtual machine that runs
your containers, not on your Windows or macOS disk. Treat it as the engine's
private storage and work with volumes through Docker and containers instead
of editing files there; chapter 04 shows how to copy data in and out.

If you'd like to see how the engine builds the layered view and what
copy-on-write costs for large files, the optional
[layer deep dive](../advanced/images-and-distribution/image-content-and-writable-layers.md)
follows a write through copy-up. You don't need it for the rest of this module.

## What survives what

Now we can predict the effect of common operations on each kind of file.
Before reading the table, try filling it in yourself for the writable layer
and the volume, using the two `docker diff` results above.

| Operation | Image layers | Writable layer | Named volume |
|---|---|---|---|
| `docker stop`, then `docker start` | Unchanged | Kept | Kept |
| `docker restart` | Unchanged | Kept | Kept |
| `docker rm` of the container | Unchanged | Deleted | Kept |
| Replacement with a new container | Unchanged | Fresh and empty | Kept, if mounted again |
| `docker volume rm` | Unchanged | Not affected | Deleted |

Read the last two columns together and you have the rule for the service:
**anything worth keeping must be written to a volume, because replacement is
how containers change**. A container that keeps nothing important in its
writable layer can be thrown away and recreated at any time, which is what
people mean when they call a container *stateless*. The service is stateful,
since it remembers notes, but its containers no longer have to be.

Test one row now, using the container without a volume. Stop it, remove it
and start a replacement on the same port:

```text
docker stop ark-notes-layer
docker rm ark-notes-layer
docker run -d --name ark-notes-layer -p 127.0.0.1:8081:8000 ark-notes:v1
docker diff ark-notes-layer
```

`docker diff` has nothing to report, and `http://127.0.0.1:8081/notes` shows
an empty list. The note `Only in this container` was deleted with the first
container's writable layer.

## A volume has its own lifecycle

Since volumes outlive containers, they need looking after on their own.
List them:

```text
docker volume ls
```

You should find `ark-notes-data` among them, possibly beside volumes from
other projects. `docker volume inspect ark-notes-data` shows when it was
created and its driver, `local`, which stores the files on the engine's own
disk.

Docker protects a volume while a container refers to it. Try removing ours:

```text
docker volume rm ark-notes-data
```

The engine refuses with `volume is in use`, followed by the container's ID.
The same happens when the container is merely stopped, because a stopped
container keeps its mounts for the next start. Only after `docker rm` of every
container that uses it can the volume be deleted, and `docker rm` never takes
a named volume with it. That's a deliberate asymmetry: removing a container
is routine, while removing data should be a separate decision you make by name.

You may also see entries named with long strings of random hexadecimal
characters. Those are **anonymous volumes**, created when a container
asks for a volume without giving it a name. Some images declare their data
directories with a `VOLUME` instruction, which makes Docker create one for each
new container; the official `registry` image, which stores the images pushed
to it, declares one for that storage. Our image has no such instruction, so
a volume appears only when you ask for it at launch. `docker rm -v` removes
a container together with its anonymous volumes, while named ones always stay.

Beware of `docker volume prune`. By default it deletes every anonymous volume
that no container currently uses, and with `--all` every unused named volume
as well. It doesn't know which of them belong to this course or to another
project on your machine, and a deleted volume can't be recovered. Remove
the volumes you created by name instead, after checking that no container
you still need uses them.

## Clean up the experiment

Remove the container without a volume, which has nothing to keep:

```text
docker stop ark-notes-layer
docker rm ark-notes-layer
```

The next chapter starts its mount experiments on port 8080, so remove the
service container while keeping the volume and its note for the backup
exercise:

```text
docker stop ark-notes
docker rm ark-notes
```

`ark-notes-data` remains untouched. Chapter 03 will compare the volume with
the other mount types; the final chapter will use this note to test a backup.
