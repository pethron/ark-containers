---
title: "Image content and writable layers"
track: architecture
---

# Image content and writable layers

After the [local image handover](../../03-images-and-registries/README.md),
you gave one image a second tag, saved it, and loaded it without installing
Python again. What exactly was in that archive? Not a running machine and not
just one executable: it carried filesystem content plus configuration describing
how that content can be used.

## Layers describe changes

An image manifest refers to ordered filesystem layers and a configuration
object. A layer describes changes such as adding files, replacing content or
removing paths from a lower layer's view. The manager applies those changes
in order to prepare the filesystem the container will see.

Layers are useful for sharing content. Two images can reference the same base
layers, so the engine doesn't need to download and store every byte twice.
But the exact storage representation depends on the engine's image store and
snapshotter; a compressed registry blob isn't identical to its unpacked local
filesystem representation.

Deletion also has a catch. Removing a large file in a later layer hides it from
the merged view, but doesn't retroactively erase its bytes from an earlier
distributed layer. That matters for both size and secrets. Never rely on
"copy credentials, use them, then delete them" to keep them out of an image.

## Defaults are configuration, not instructions running again

The image configuration can include command defaults, environment defaults,
working directory, user and other execution metadata. At container creation,
runtime choices can override several of these values.

Image history can help explain how content was built:

```text
docker image history --no-trunc docker.io/library/python:3.12-alpine
docker image inspect docker.io/library/python:3.12-alpine --format 'user={{json .Config.User}} command={{json .Config.Cmd}} layers={{json .RootFS.Layers}}'
```

These are read-only inspections. History isn't a complete trustworthy build
recipe, and not every history entry corresponds to a nonempty filesystem
layer. Don't assume you can reconstruct the exact original Dockerfile and
build inputs from that output.

`RootFS.Layers` commonly lists uncompressed layer identities called DiffIDs.
The registry manifest's layer descriptors normally identify the distributed
blob representation, often compressed. Different digests can be correct
because they're hashing different bytes.

## The container adds instance-local writes

The image content doesn't change when an application writes a new temporary
file. Docker gives the container writable state above the image content.
That state belongs to this instance and normally disappears on removal.

With an OverlayFS-backed setup, this often involves lower read-only content,
an upper writable directory and a merged view. Updating a lower file can
trigger a **copy-up** before the modification is applied. Other backends and
snapshotters can implement the prepared filesystem differently.

Don't use private engine storage directories as an application interface,
especially not inside Docker Desktop's VM. Use supported inspection commands
and filesystem behavior to understand the lifecycle without editing the
engine's database or layer directories.

## Observe a write without altering the image

Check that `ark-layer-note` is a free container name. This finite
command writes a single small file; keep the stopped object for inspection:

```text
docker run --name ark-layer-note --pull never python:3.12-alpine sh -c 'echo one-instance > /tmp/ark-layer-note'
```

Then inspect the changes and compare the image ID:

```text
docker diff ark-layer-note
docker image inspect docker.io/library/python:3.12-alpine --format '{{.Id}}'
```

Expect the new path among the container's filesystem changes and the image ID
to remain unchanged. Other runtime-created differences can appear too.
`docker diff` doesn't make a backup of mounted application data.

Remove only `ark-layer-note`. A fresh container from that image shouldn't have
the note: its previous writable layer wasn't a new image layer. Module 05
will give intentional data a separate persistence plan.

For how mounts and root paths are assembled, see the optional
[root filesystem deep dive](../linux-primitives/05-root-filesystems-chroot-and-pivot-root.md).
The main decision is already available: image content is an input, container
writes are instance state, and mounted data has its own lifecycle.

Next, [tags, digests and manifests](digests-manifests-and-multi-arch-images.md)
explain which of those inputs a name actually identifies.
