---
title: "Layers and the root filesystem"
track: architecture
---

# Layers and the root filesystem

Your restored `ark-message:handover` brought the service back without a
separate copy of `app.py`. The launch supplied a message and a port, and a
Python program came up listening on port 8000. Let's open the archive we just
tested and follow the files and defaults that made that possible.

## Look inside the handover

From the same directory where you saved `message.tar`, list its entries and
read the manifest Docker included:

```text
tar -tf ark-image-handover/message.tar
tar -xOf ark-image-handover/message.tar manifest.json
```

In the manifest, find `RepoTags`, `Config` and `Layers`. They identify the
handover tag, an image configuration file and the filesystem changes needed
to assemble the image. Match the configuration and layer paths to entries in
the listing; the long names and number of layers depend on the image and
engine. Some engines also include `oci-layout`, `index.json` and content
under `blobs/sha256/`. Older archive layouts can use different paths, so
follow the manifest you actually received.

The **Open Container Initiative** (OCI) defines common image and distribution
formats. A digest such as `sha256:...` identifies the bytes of a particular
object; we'll compare the kinds of objects when we inspect the registry.

Along with its files, an image carries **configuration defaults** for the
containers created from it, such as a command, a working directory or a user.
Ask Docker for the ones our image records:

```text
docker image inspect --format '{{json .Config.Cmd}} {{.Config.User}} {{.Config.WorkingDir}}' ark-message:handover
```

You should see `["python","/app/app.py"]`, the user `ark` and the directory
`/app`. That default command is why our launch never mentioned Python, and
why words added after the image name, such as `python --version`, could
replace it for a single container.

## Files arrive in layers

The files in an image are assembled through a sequence of filesystem
changes called **layers**. Each layer builds on the result of the previous
ones, adding, changing or removing files from the view that a new container
will receive. Related images can share layers, which allows Docker to reuse
content it already stores when another image needs it.

We can see how our image was assembled by asking for its history:

```text
docker image history ark-message:handover
```

The list starts from the most recent step. The first few entries are ours:
creating the `ark` user, setting `/app` as the working directory, copying
`app.py` and recording the user and the default command. Below them you'll
find the steps that installed Python, with a `PYTHON_VERSION` value among
them, and at the bottom the files of a small Alpine Linux system. Our image
was built on top of a Python image, which was built on top of Alpine, and each
level kept the layers of the one below. The `<missing>` in the first column
only means that those intermediate steps aren't stored as separate images on
your engine; their layers are all there.

Some entries add filesystem content and show a size; others record
configuration and show `0B`, so the history can have more entries than the
image has filesystem layers.

There is one consequence worth keeping in mind already: a later layer can
hide a file whose bytes remain in an earlier layer. If that file contains
a password or a private key, anyone receiving those layers may still be
able to recover it. Keep secrets out of the image from the beginning,
including intermediate steps.

## Stacking layers into one filesystem

`docker image history` shows the layers one by one, yet a container started
from this image sees a single directory tree under `/`, with Python's files
in their usual places and `app.py` under `/app`. Something has to combine the layers before the main
process starts, and that's the job of a **union filesystem**, which stacks
several directories and presents them as one. On Linux, Docker normally
relies on **OverlayFS**, a union filesystem built into the kernel. The engine
mounts it, attaching it to the directory tree where processes can open its
files, and that mount becomes the container's `/`.

OverlayFS combines read-only lower directories with one writable upper
directory. The image layers are the lower directories, stacked in order, and
when the same path exists in more than one of them, a process reads the copy
from the highest layer. A removed file is recorded as a special marker that
hides the path below it, which is how a later layer can hide a secret whose
bytes remain in an earlier one. Above the image layers, Docker adds a thin
**writable layer** that belongs to a single container. New files land there,
and a file from the image is copied up into it before a process modifies
it, so the image layers never change. Every container created from the same
image can therefore share those layers, and each one stores only its own
changes.

Engines can use different storage implementations to prepare these mounts.
You can ask Docker which driver your engine reports:

```text
docker info --format '{{.Driver}}'
```

You might see `overlayfs` or `overlay2`; the precise storage layout depends
on the engine. The useful model here is the same: image content provides the
starting filesystem and each container receives a place for its own changes.

If you'd like to see how the lower, upper and merged directories fit
together and what copying up costs, the optional
[layer deep dive](../advanced/images-and-distribution/image-content-and-writable-layers.md)
follows a write through the stack.

## The container's files are a different lifetime

Suppose you write a note to `/tmp/ark-note` inside a running service
container, an experiment that module 02 walks through. The note survives a
stop/start because Docker keeps that container's writable filesystem.
When you create a replacement, Docker gives it a fresh writable filesystem
on top of the same image, so the note is gone and the original starting
files are back. Changes made during the first container's life stay with
that container.

We can now account for where everything in our service comes from: the
image supplies Python, `app.py` and the default command, the launch command
supplies the message and the published port, and the container's writable
filesystem holds the note. Saving the image will capture the first group,
which is enough to start the service. Our colleague will still need the launch
settings to make it say what we want and reach it from their browser.

The archive exercise tested that distinction. Keep the tag and archive while
we compare [manifest identities and platforms](05-choose-the-reference-to-hand-over.md).
