---
title: "Identify and transfer an image"
track: runbook
---

# Identify and transfer an image

You send a colleague the command that worked yesterday. They pull the same tag
today, yet their Python version is different. Nobody changed the application
source. What exactly did the handover identify?

Let's deliver an identified runtime artifact, not just a name that can move.
We're still using the supplied source mount: **this transfers the Python image,
not a self-contained image of our service**. Building that comes next module.

## Identify the local input

Use the module-01 Bash setup and Linux containers. In a rootful native Engine,
prefix Docker commands with `sudo`. Run this module from the course root.
You need registry access for the initial pull and enough local disk for an
image archive; no registry account, local Python or extra client is required.

```bash
docker pull docker.io/library/python:3.12-alpine
docker image inspect docker.io/library/python:3.12-alpine --format \
  'id={{.Id}} platform={{.Os}}/{{.Architecture}} repository-digests={{json .RepoDigests}}'
docker image ls --digests docker.io/library/python
```

Record the image ID, platform and repository digest references in your notes.
The image ID and a repository manifest/index digest identify different objects;
we'll unpack that in chapter 03. Don't copy a digest from this course text:
inspect what your engine actually retrieved.

Ask Docker to run the already-local image without resolving a newer tag:

```bash
docker run --rm --pull never \
  docker.io/library/python:3.12-alpine python --version
```

The short-lived diagnostic container is automatically removed. Keep the output
with the identity notes; a version string alone isn't a content identifier.

## Give the local artifact a handover name

Check that `ark-runtime:handover` is unused with `docker image ls ark-runtime`.
If it belongs to another task, choose a different tag throughout this exercise.

```bash
docker tag docker.io/library/python:3.12-alpine ark-runtime:handover
docker image inspect ark-runtime:handover --format '{{.Id}}'
```

The new tag references the same local image ID. Tagging didn't rebuild Python,
copy its layers into another independent image or upload anything.
It is a convenient reference, not a way to make a tag immutable.

## Put it in an archive

Create a new local directory, refusing to overwrite an existing one:

```bash
mkdir ark-image-handover
docker image save --output ark-image-handover/runtime.tar ark-runtime:handover
tar -tf ark-image-handover/runtime.tar
```

If `mkdir` fails because the directory exists, stop and inspect your own previous
attempt rather than continuing over an unknown archive. The archive is a
Docker image transfer artifact, not the result of `docker export`. Modern
engines may include additional OCI layout metadata; don't assume one fixed
internal file list.

`docker save` contains image configuration and layer data for content available
locally. It doesn't collect your source mounts, application environment overrides,
named volumes or process memory. Saving a locally selected image also doesn't
magically retrieve every platform in the remote index.

## Prove that load restores the intended local artifact

No running course service should depend on the *tag name* below. Removing that
extra tag doesn't delete the original Python reference:

```bash
docker image rm ark-runtime:handover
docker image load --input ark-image-handover/runtime.tar
docker image inspect ark-runtime:handover --format \
  'id={{.Id}} platform={{.Os}}/{{.Architecture}}'
```

Compare the ID and platform with your recorded values. Then rerun the bounded
`python --version` diagnostic, replacing the image reference with
`ark-runtime:handover`. You have demonstrated tag restoration from an archive,
not a network-isolated second host: the engine may still have shared layers
in its cache.

For an actual second compatible engine, copy the archive and load it there.
Verify the same ID and intended platform before launching. If the second host
uses a different CPU architecture, don't assume this archive is the appropriate
artifact; chapter 06 covers that decision.

## Return to the service

Use the module-01 or module-02 launch procedure with `ark-runtime:handover`
in place of the moving Python tag and verify the same HTTP contract. Keep its
source mounts: this image still doesn't contain our Python application.
Record the image ID from the running container with:

```bash
docker inspect --format 'image-id={{.Image}} requested={{.Config.Image}}' YOUR_CONTAINER_NAME
```

Replace the placeholder with your actual service name. The first field is the
local image identity used at creation; the second is the requested reference.
A later tag change doesn't replace that already-created container's filesystem.

Keep the handover archive and tag for the registry chapter. If finishing here,
remove only the test service you created and the extra `ark-runtime:handover`
tag. To delete the lab archive, remove the exact `ark-image-handover/runtime.tar`
file and then its empty directory; never use a global image prune.

Next, [image content and writable layers](02-image-content-and-layers.md).
