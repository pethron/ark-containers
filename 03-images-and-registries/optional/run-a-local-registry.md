---
title: "Run a local registry"
track: runbook
---

# Run a local registry

Suppose your colleague needs several image updates over the next few days.
Passing an archive each time would work, although a shared place to
retrieve those images would soon be more convenient. Let's try that
publication workflow with a registry on your own computer, where you
can push and pull the handover image without setting up an external account.

This optional lab uses a local Docker Engine or Docker Desktop running
Linux containers, plus the `registry:3` image. Docker may need internet
access to download that image at launch, so check that your environment
allows it.

We'll keep the registry disposable and accessible over HTTP on loopback.
That makes it suitable for this local experiment; a shared production
registry would also need decisions about durable storage, TLS and
authentication, which we'll leave outside this lab.

## Before you start

We'll publish the `ark-runtime:handover` tag from
[One image, several names](../02-one-image-several-names.md). If
`docker image ls ark-runtime` doesn't show it, recreate it from any
directory. If Docker can't find `python:3.12-alpine`, run
`docker pull python:3.12-alpine` first:

```text
docker tag python:3.12-alpine ark-runtime:handover
docker image inspect --format '{{.Id}}' ark-runtime:handover
```

Keep the ID in your notes for the final comparison. The registry container
will be called `ark-registry` and listen on loopback port 15000, so check
`docker ps -a` and make sure both are free. Also run
`docker image ls 127.0.0.1:15000/ark/runtime` before assigning the lab tag;
if that reference belongs to another task, choose an unused name and
adjust it throughout the exercise.

## Start a temporary registry

With the name and port free, start the registry:

```text
docker run -d --name ark-registry -e REGISTRY_STORAGE_FILESYSTEM_ROOTDIRECTORY=/tmp/ark-registry-data -p 127.0.0.1:15000:5000 registry:3
```

The long environment setting chooses `/tmp/ark-registry-data` as the place
for uploaded content. This keeps the data in the container's writable
filesystem, so removing the container will also remove the uploads.
The image declares a separate default storage volume, which we'll clean
up at the end; persistent storage for our own services comes in module 05.

Open `http://127.0.0.1:15000/v2/` in your browser and look for a successful
response, normally containing `{}`. If the registry is still starting,
wait and retry, then read `docker logs ark-registry` if it keeps failing.
Docker Engine normally accepts HTTP registries on loopback; if your
organization's policy prevents that, use an approved lab environment and
leave the security checks in place.

## Publish and retrieve the image

To send our image to this registry, we first give it a reference containing
the registry's address and port. The tag command prepares that reference
locally, and the following push uses it as the upload destination:

```text
docker tag ark-runtime:handover 127.0.0.1:15000/ark/runtime:handover
docker push 127.0.0.1:15000/ark/runtime:handover
```

Look at the end of the push output and keep the reported digest, including
its `sha256:` prefix. We can use that value to request the content we just
published, even if the `handover` tag is moved later. Replace the
placeholders below with your complete digest before running each command:

```text
docker image rm 127.0.0.1:15000/ark/runtime:handover
docker pull 127.0.0.1:15000/ark/runtime@sha256:REPLACE_WITH_THE_PUSH_DIGEST
docker image inspect --format '{{.Id}}' 127.0.0.1:15000/ark/runtime@sha256:REPLACE_WITH_THE_PUSH_DIGEST
```

Compare the returned ID with the one you recorded for `ark-runtime:handover`.
Whether they match depends on how your engine stores images. With the
containerd image store, the default for new installations of recent Docker
versions, the local ID of `python:3.12-alpine` identifies the publisher's
multi-platform index. Our engine only holds the build for its own platform,
so the push uploads that build under a new digest, as a note in the push
output points out, and the retrieved image gets a different ID. The files are still the same, which we can check by
comparing the filesystem layers of both references:

```text
docker image inspect --format '{{json .RootFS.Layers}}' ark-runtime:handover
docker image inspect --format '{{json .RootFS.Layers}}' 127.0.0.1:15000/ark/runtime@sha256:REPLACE_WITH_THE_PUSH_DIGEST
```

The two lists should be identical, connecting the retrieved image to the
one we started with. As in the archive exercise, Docker can
reuse cached layers; here we've additionally tested publishing and
resolving content through our registry. The optional
[manifest deep dive](../../advanced/images-and-distribution/digests-manifests-and-multi-arch-images.md)
explains indexes and platform manifests in detail. If you'd like to run the
application with that reference too, use it in place of
`ark-runtime:handover` in the
[service launch](../04-transfer-an-image-locally.md#use-the-restored-image-for-our-service).
The browser check on port 15000 tells us that the registry's API responds,
while the service's `/health` check tells us that our application responds
after Docker creates a container from the retrieved image.

## Remove only the lab

Once you've finished testing, stop and remove any application container
you created for this lab. Then use your recorded digest to remove the
downloaded reference, and stop and remove the registry:

```text
docker image rm 127.0.0.1:15000/ark/runtime@sha256:REPLACE_WITH_THE_PUSH_DIGEST
docker stop ark-registry
docker rm -v ark-registry
```

The `-v` option also removes the anonymous volume created from the registry
image's defaults, while the uploaded content disappears with the
container's writable filesystem. This leaves the local Python image,
registry image and `ark-runtime:handover` available for other work; if
you're done with the module too, `docker image rm ark-runtime:handover`
removes just that tag. Keep the cleanup to these named resources;
force-removing the shared Python image ID or running a global prune would
reach beyond this lab.

For production concerns beyond this lab, see
[registry contracts and authentication](../../advanced/images-and-distribution/registry-contracts-and-authentication.md).
Otherwise, return to the [module overview](../README.md).
