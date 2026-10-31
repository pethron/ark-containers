---
title: "Multi-platform builds"
track: runbook
---

# Multi-platform builds

Your colleague can now run the image without a source directory. One more
question belongs in the handover: does its platform match their machine?
Python code may be portable, while the image also contains a Python
executable, system libraries and possibly compiled dependencies.

The core kata needs one tested platform. Building for another CPU and
comparing a nerdctl build are separate investigations, and no cloud account
or registry publication is required here.

## Inspect before choosing a build

Use Linux Bash or PowerShell 7 with Docker running Linux containers. Linux
Engine may require `sudo`. From the [course checkout root](../../before-you-start.md#get-the-course-files):

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\message-service
    ```

Inspect the builder and the base reference:

```text
docker buildx ls
docker buildx imagetools inspect python:3.12-alpine
```

`linux/amd64` and `linux/arm64` describe operating-system/CPU combinations.
The registry index groups platform-specific image manifests under one
reference, and a pull can select the appropriate variant. These variants
have different content, so they also have different manifest digests.
Attestation entries may appear too; they aren't additional CPU variants.

Compare the builder's available platforms with the machine you want to
support. A listed platform may be implemented through **emulation**, which
translates instructions for a different CPU. Docker Desktop supplies
emulation for common targets; a standalone Engine depends on its builder
setup. If your builder can't execute a target, use this inspection as the
alternative exercise and arrange a native machine or a suitably configured
builder later. Don't change Desktop's internal VM or install a privileged
host-wide emulator just to complete this chapter.

## Keep the outputs distinct

Where your builder supports both targets, build two named outputs.
`--platform` chooses the target, and `--load` makes each single-platform
result available in the local Docker image store:

```text
docker buildx build --platform linux/amd64 --load -t ark-message:amd64 .
docker buildx build --platform linux/arm64 --load -t ark-message:arm64 .
docker image inspect --format '{{.RepoTags}} {{.Os}}/{{.Architecture}} {{.Id}}' ark-message:amd64 ark-message:arm64
```

Expect the requested architectures and distinct IDs. The `RUN adduser`
instruction executes target-platform code during each build, so this recipe
needs either native execution or emulation for that target. Adding a platform
flag alone can't provide that capability.

Choose a supported variant, ensure the name and port are free, then run it
with the matching platform. For the arm64 output:

```text
docker run -d --platform linux/arm64 --name ark-platform -p 127.0.0.1:8080:8000 ark-message:arm64
```

Open `http://127.0.0.1:8080/` and `/health`, retrying after startup. On an
amd64 laptop, successful arm64 requests are emulated execution evidence;
they don't certify native arm64 behavior or performance. If the container
exits with an execution-format error, inspect its platform and your runtime's
emulation support before changing the application.

For a dependency-bearing application, compile its native extensions separately
for each target too. The template service's compiled MarkupSafe extension is
a reason to keep builder and runtime platforms aligned. Cross-compilation can avoid
emulating a compiler when a language supports it, but it requires a recipe
that deliberately separates the build and target platforms.

```text
docker stop ark-platform
docker rm ark-platform
```

## One reference, several variants

A multi-platform result contains an index plus its variant manifests and
layers. Modern Docker installations with the containerd image store can
load that result locally:

```text
docker buildx build --platform linux/amd64,linux/arm64 --load -t ark-message:multi .
```

This command requires a builder and image store that support multi-platform
loading. An older classic image store may reject it even when the two
single-platform builds work. Keep those separate outputs as the fallback;
changing a shared daemon's storage configuration is outside this lab.
Other build configurations can export to an OCI archive or push an index
directly to a registry, but a build result isn't automatically present in
every local runtime's image store.

Explain which object a colleague would select: an index digest can preserve
the set of variants, while a platform-manifest digest identifies one variant.
Either still needs testing on the intended receiving environment. The
[distribution deep dive](../images-and-distribution/digests-manifests-and-multi-arch-images.md)
follows those objects in more detail.

Remove only the tags you built, after removing any containers using them:

```text
docker image rm ark-message:amd64 ark-message:arm64
```

If you also loaded `ark-message:multi`, remove that tag separately:

```text
docker image rm ark-message:multi
```

## Optional: the same recipe through nerdctl

This comparison needs a **separate disposable Linux VM** with Bash,
standalone containerd, runc, nerdctl and a working BuildKit daemon. It is
for readers who have completed the
[standalone runtime lab](../runtime-architecture/06-docker-nerdctl-and-ctr-side-by-side.md).
That lab doesn't install BuildKit; follow the
[nerdctl build setup guide](https://github.com/containerd/nerdctl/blob/main/docs/build.md)
for that additional prerequisite before continuing. Use the standalone
containerd endpoint below, never Docker's private socket.

From `04-building-images/message-service` in that VM, inspect the existing
namespaces, then create `ark-build-lab` only if it is unused:

```bash
sudo ctr --address /run/containerd/containerd.sock namespaces list
sudo ctr --address /run/containerd/containerd.sock namespaces create ark-build-lab
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  build -t ark-message:nerdctl .
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  run -d --name ark-direct-build --net none ark-message:nerdctl
```

BuildKit's worker and socket must match your configured setup. If discovery
fails, diagnose the BuildKit connection using the setup guide; a running
containerd daemon alone doesn't supply the builder.

`--net none` avoids requiring CNI networking or publishing a VM port.
Wait for the listening log, then test HTTP from inside the container:

```bash
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  logs ark-direct-build
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  exec ark-direct-build python -c \
  'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8000/", timeout=5).read().decode()); print(urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=5).read().decode())'
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  exec ark-direct-build whoami
```

Expect the default message, a successful health response and `ark`. Compare
those with the Docker build's checks, recording the platform, base resolution,
tool versions and cache state. The clients can use the same Dockerfile
frontend and BuildKit while keeping different image stores and cache state.
Equal recipes therefore don't guarantee equal output IDs, and a Docker-built
tag doesn't automatically appear in standalone containerd.

Clean up through the client that created the resources:

```bash
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  stop ark-direct-build
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  rm ark-direct-build
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-build-lab \
  rmi ark-message:nerdctl
sudo ctr --address /run/containerd/containerd.sock --namespace ark-build-lab images list
sudo ctr --address /run/containerd/containerd.sock --namespace ark-build-lab containers list
sudo ctr --address /run/containerd/containerd.sock --namespace ark-build-lab tasks list
```

Remove the namespace only after confirming it contains no remaining lab
objects, including any base-image references the worker imported. If objects
remain, inspect them and remove only the lab's exact references before
continuing:

```bash
sudo ctr --address /run/containerd/containerd.sock namespaces remove ark-build-lab
```

BuildKit caches have a separate lifetime and management interface.
The VM can be discarded after its other experiments are finished.

Return to the [packaging kata](../../04-building-images/katas/README.md) with one more boundary to
document: which platform you actually tested. The
[official multi-platform guide](https://docs.docker.com/build/building/multi-platform/)
describes the supported builder and output combinations.
