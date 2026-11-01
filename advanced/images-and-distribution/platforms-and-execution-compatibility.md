---
title: "Platforms and execution compatibility"
track: architecture
---

# Platforms and execution compatibility

You can now identify a specific image and retrieve it from a registry. Does
that mean it will run on every computer? Not quite: the box doesn't contain
a replacement CPU or Linux kernel.

Let's make the compatibility check explicit before your colleague discovers
it during the demonstration.

## Three different compatibility questions

**Operating system:** the image's userspace expects an operating-system syscall
interface. Our examples are Linux containers. Windows containers are a different
execution mode; changing a tag doesn't make a Linux process a Windows process.

**CPU architecture and variant:** executable instructions must be supported by
the target CPU, either natively or through an intentionally configured emulator.
An index helps select content; it doesn't translate the executable itself.

**Kernel and policy:** the shared host kernel must provide the required
features, and security policy must allow the needed operations. The exact same
image can therefore behave differently on two hosts.

These aren't reasons to abandon image identity. They're the rest of the
execution contract that an image alone can't provide.

## Record what you're actually running

Use your ordinary Linux Docker context. These observations create only a
short-lived diagnostic container:

```text
docker info --format 'engine={{.OSType}}/{{.Architecture}}'
docker image inspect ghcr.io/pethron/ark-message:1 --format 'image={{.Os}}/{{.Architecture}}'
docker run --rm ghcr.io/pethron/ark-message:1 uname -m
docker run --rm ghcr.io/pethron/ark-message:1 uname -r
```

Engine architecture naming may use `x86_64` where image descriptors use `amd64`,
or `aarch64` where they use `arm64`. Under emulation, userspace observations can
also differ from the physical host. Inspect image metadata and platform
selection rather than treating one `uname` string as a complete answer.

Return to the [manifest exercise](digests-manifests-and-multi-arch-images.md). Find a second supported
architecture without running it. Describe which descriptor another machine
would select and why its local image ID could legitimately differ.

## Optional: an intentionally emulated run

Only attempt this if your Docker environment already supports the target
architecture through its documented emulation setup. Docker Desktop commonly
provides this integration; a native Linux engine may not. Don't install a
privileged binfmt helper on a shared host just for this course.

On an amd64 engine with arm64 emulation available, this separate Python
example may pull an image if it isn't already present:

```text
docker run --rm --platform linux/arm64 docker.io/library/python:3.12-alpine python --version
```

On arm64, use `linux/amd64` only if that direction is supported. If execution
fails with `exec format error`, record the mismatch and use the inspection-only
exercise instead. A successful emulated version check is not a native
performance benchmark or certification of the full application.

## Architecture isn't every CPU feature

Two amd64 processors can support different instruction extensions. A binary
requiring an unavailable feature may terminate with `Illegal instruction`
despite a matching broad architecture label. Base libraries and application
build flags can introduce those requirements.

Likewise, a userspace library may depend on kernel behavior or syscall fallback
that an older engine's seccomp policy handles differently. Diagnose the actual
error, image identity, host/kernel version and policy rather than assuming
"same image" eliminates environmental differences.

An unavailable syscall and a denied syscall can have different effects. No
unsupported kernel installation is needed to understand that distinction.

## Finish the handover

Your artifact notes should now name the repository digest, intended platform,
observed local image ID and any material host requirements. Record the launch
settings too: image identity alone doesn't capture the options chosen when a
container starts.

Return to the [local handover kata](../../03-images-and-registries/katas/README.md), then continue to
[Building images](../../04-building-images/README.md), where you write a
recipe for an image containing the service.
