---
title: "Digests, manifests and multi-arch images"
track: architecture
---

# Digests, manifests and multi-arch images

You and a colleague both say you're using `python:3.12-alpine`, then discover
that your Intel laptop and their arm64 machine may have selected different
image content. The shared tag gives you a familiar name, but a production
rollback needs stronger evidence that you are talking about the same artifact.
Let's look at what each kind of identity tells you, and where platform
selection enters the picture.

## Names and content answer different questions

When someone asks whether two deployments used "the same image", first decide
what kind of sameness matters. A tag names a repository reference, while a
digest identifies the bytes of a particular registry object. A multi-platform
image adds another choice: the index can point to several platform-specific
manifests, each with its own identity.

| Identifier | What it tells you |
|------------|-------------------|
| Tag, such as `3.12-alpine` | A repository name that can resolve to different content over time |
| Index or manifest-list digest | Identity of a document selecting or grouping other manifests |
| Platform-manifest digest | Identity of one manifest and its referenced configuration/layers |
| Configuration digest / local image ID | Identity of image configuration, not necessarily its registry manifest |
| Layer blob digest | Identity of one distributed blob representation |

A content digest gives you the identity of that object's bytes. It does not
describe whether the application is secure or whether the server ran with the
intended launch options, so an immutable input still needs appropriate runtime
configuration.

Registries can represent content with OCI or Docker media types. Read the
document you actually received before deciding which format it uses.

## Follow platform selection

Now let's see how those identities guide a real platform selection. This
optional exercise needs registry access and an already-local Python image.
The commands inspect local metadata and contact the registry, but they do not
create a running container:

```text
docker image inspect docker.io/library/python:3.12-alpine --format 'platform={{.Os}}/{{.Architecture}} image-id={{.Id}}'
docker manifest inspect docker.io/library/python:3.12-alpine
```

An index normally includes descriptors for the platforms it supports. Find
the manifest descriptor that matches the platform you intend to run, including
its variant where relevant, and record that descriptor's digest. Some modern
indexes also contain attestations whose platform fields are `unknown`, so
check each descriptor before treating it as a runnable image.

For this exercise, use your engine's native Linux platform. Write down which
platform that is, then copy its matching digest from the output:

=== "Linux (Bash)"

    ```bash
    platform='linux/amd64'
    platform_digest='sha256:REPLACE_WITH_THE_MATCHING_MANIFEST_DIGEST'
    ```

=== "Windows (PowerShell)"

    ```powershell
    $platform='linux/amd64'
    $platform_digest='sha256:REPLACE_WITH_THE_MATCHING_MANIFEST_DIGEST'
    ```

On an arm64 engine, change `platform` to `linux/arm64`; otherwise use the
appropriate supported platform for your host. Before running either command
below, replace the digest placeholder with the matching value from your
inspection. The placeholder itself is not executable course data.

```text
docker pull --platform "$platform" "docker.io/library/python@$platform_digest"
docker run --rm --platform "$platform" "docker.io/library/python@$platform_digest" python --version
```

If the descriptor is wrong or unsupported, keep the error and correct your
selection. Removing `--platform` would hide whether the intended content ran.
The runtime image remains cached after Docker removes the diagnostic container.

## Pinning an index or pinning a platform

Pinning an index digest fixes the set of platform manifests it references, and
the engine still selects the applicable manifest from that set. As a result,
two architectures can legitimately execute different manifests while using
the same index identity.

Pinning a platform-manifest digest identifies one platform's image content more
specifically. Your host still needs to be able to execute that architecture.
For incident notes, record the requested reference, intended platform and
resolved local image ID; for deployment, use the appropriate immutable registry
reference rather than relying on a remembered version string.

A Dockerfile alone cannot establish the exact bytes you retrieved because base
tags, package repositories and other build inputs can change. Module 04 will
follow that build side; here, preserve the identity of the artifact you
actually received.

## Return to the handover

Let's bring the distinction back to our archive handover. Repeating it with
the same local image ID and platform gives you stronger evidence than knowing
that both machines ran the same tag. When you compare registry digests, first
identify whether each one belongs to an index or a platform manifest; then
you can tell whether a difference points to different content or simply a
different level of the image.

The [OCI image explanation](../runtime-architecture/04-oci-image-and-distribution-specs.md)
and its diagram show how indexes, manifests, configurations and layers fit
together. You can use these distinctions in your delivery notes without
learning the runtime specification first.

If you'd like to follow the artifact through a registry you control, optionally
[run a local registry](../../03-images-and-registries/optional/run-a-local-registry.md)
and retrieve it from there.
