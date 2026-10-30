# 05: Storage

So far our service has traveled as a single image that anyone could replace
with a newer one. That works beautifully while the service has nothing to
remember. In this module it starts keeping notes, and replacing the container
must no longer cost us those notes.

We'll lose the notes first, by replacing the container that wrote them,
then keep them in a volume that outlives every container. From there we'll
look at where a container's files actually live, choose between volumes, bind
mounts and tmpfs for different needs, and finish by backing up the notes and
proving that the backup can be restored.

## What you will learn

- Keep a service's data in a named volume so it survives container replacement
- Explain the image layers, the writable layer and mounts, and predict what
  survives stop, removal and replacement
- Look after volumes without deleting data by accident
- Choose a volume, a bind mount or tmpfs, and diagnose a mount the service
  can't write to
- Back up a volume, restore it into a new one and verify the result through
  the service

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Give the service a memory](01-give-the-service-a-memory.md) | R |
| 02 | [Where a container's files live](02-where-container-files-live.md) | A |
| 03 | [Choose a volume, a bind mount or tmpfs](03-choose-a-volume-bind-mount-or-tmpfs.md) | R |
| 04 | [Back up and restore the notes](04-back-up-and-restore-the-notes.md) | R |

The chapters use the [notes service](notes-service/README.md), a small web
service that saves notes to a file. Keep its complete directory when you clone
the course, including the hidden `.dockerignore`.

Finish with [notes from the old release](katas/README.md), where you move
data written by root to the non-root image, prove that it can be restored
and choose storage for a new requirement.

## Optional paths

If you're curious how the engine assembles a container's files and what
copy-on-write costs, the [layer deep dive](../advanced/images-and-distribution/image-content-and-writable-layers.md)
follows a write through copy-up. Nothing in this module depends on it.

From memory, explain why `docker diff` shows nothing for
a service that writes all its data to a volume, and why removing a container
never removes a named volume.

Next: [Networking](../06-networking/README.md).
