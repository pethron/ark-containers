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
allows it and keep `ark-runtime:handover` available from the archive
exercise. You can load the archive again if you already removed its tag.

We'll keep the registry disposable and accessible over HTTP on loopback.
That makes it suitable for this local experiment; a shared production
registry would also need decisions about durable storage, TLS and
authentication, which we'll leave outside this lab.

## Start a temporary registry

We'll name the container `ark-registry` and make it available on loopback
port 15000, so check that both are free. Also run
`docker image ls 127.0.0.1:15000/ark/runtime` before assigning the lab tag;
if that reference belongs to another task, choose an unused name and
adjust it throughout the exercise.

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
published, even if the `handover` tag is moved later. Replace both
placeholders below with your complete digest before running the commands:

```text
docker image rm 127.0.0.1:15000/ark/runtime:handover
docker pull 127.0.0.1:15000/ark/runtime@sha256:REPLACE_WITH_THE_PUSH_DIGEST
docker image inspect --format '{{.Id}}' 127.0.0.1:15000/ark/runtime@sha256:REPLACE_WITH_THE_PUSH_DIGEST
```

Compare the returned ID with `ark-runtime:handover` to connect the retrieved
image to the one we started with. As in the archive exercise, Docker can
reuse cached layers; here we've additionally tested publishing and
resolving content through our registry. If you'd like to run the
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
registry image and handover archive available for other work. Keep the
cleanup to these named resources; force-removing the shared Python image
ID or running a global prune would reach beyond this lab.

For production concerns beyond this lab, see
[registry contracts and authentication](../../advanced/images-and-distribution/registry-contracts-and-authentication.md).
Otherwise, return to the [module overview](../README.md).
