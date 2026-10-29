---
title: "Digests, manifests and multi-arch images"
track: architecture
---

# Digests, manifests and multi-arch images

Two colleagues say "I'm using `python:3.12-alpine`". One means the bytes pulled
last month on an Intel laptop; the other means today's arm64 selection. They
agree on a tag, but haven't yet established that they agree on an artifact.

Let's give each kind of identity a job. This is worth getting right before a
production rollback depends on it.

## Names and content answer different questions

| Identifier | What it tells you |
|------------|-------------------|
| Tag, such as `3.12-alpine` | A repository name that can resolve to different content over time |
| Index or manifest-list digest | Identity of a document selecting or grouping other manifests |
| Platform-manifest digest | Identity of one manifest and its referenced configuration/layers |
| Configuration digest / local image ID | Identity of image configuration, not necessarily its registry manifest |
| Layer blob digest | Identity of one distributed blob representation |

A content digest hashes bytes of a particular object. It doesn't mean "the
application is secure" or "the server ran the intended launch options".
An immutable input still needs appropriate runtime configuration.

The same registry content may use OCI or Docker media types. Read the actual
document instead of assuming every registry response uses one format.

## Follow platform selection

Use the Docker setup from chapter 01. These commands inspect local metadata
and contact the registry; they create no running container:

```bash
docker image inspect docker.io/library/python:3.12-alpine --format \
  'platform={{.Os}}/{{.Architecture}} image-id={{.Id}}'
docker manifest inspect docker.io/library/python:3.12-alpine
```

An index normally includes descriptors for supported platforms. Find the
manifest descriptor matching the platform you intend to run, including its
variant where relevant, and record its digest. Some modern indexes also
contain attestations whose platform fields are `unknown`; don't mistake every
descriptor for a runnable image.

For this exercise, use your engine's native Linux platform. Write down the
platform and copy the matching digest from the actual output:

```bash
platform='linux/amd64'
platform_digest='sha256:REPLACE_WITH_THE_MATCHING_MANIFEST_DIGEST'
```

Change `platform` to `linux/arm64` on an arm64 engine, or the appropriate
supported platform for your host. Replace the digest placeholder before
running either command below; it isn't executable course data.

```bash
docker pull --platform "$platform" "docker.io/library/python@$platform_digest"
docker run --rm --platform "$platform" \
  "docker.io/library/python@$platform_digest" python --version
```

If the descriptor is wrong or unsupported, keep the error and correct the
selection; don't remove `--platform` to pretend the intended content ran.
The runtime image remains cached after the diagnostic container is removed.

## Pinning an index or pinning a platform

Pinning an index digest fixes the set of referenced platform manifests, while
the engine still selects the applicable platform from that set. Two different
architectures can legitimately execute different manifests under that one
index identity.

Pinning a platform-manifest digest is more specific about the image content,
but it doesn't make that architecture executable on an incompatible host.
For incident notes, record the requested reference, intended platform and
resolved local image ID. For deployment, use the appropriate immutable registry
reference rather than a remembered version string.

A Dockerfile is weaker evidence of exact bytes: floating base tags, package
repositories and build inputs can change. We'll address the build side in
module 04; for now, preserve the identity of the artifact actually retrieved.

## Return to the handover

If you repeat the earlier archive handover with the same local image ID and
platform, you have stronger evidence than "both ran the same tag". If you
compare registry digests, identify whether they're index or platform manifests
before declaring a mismatch.

The optional [OCI image explanation](../advanced/runtime-architecture/04-oci-image-and-distribution-specs.md)
and its diagram show the graph of index, manifest, config and layers. You don't
need to learn the runtime spec to use the distinction in your delivery notes.

Next, [run a local registry](04-run-a-local-registry.md) and retrieve the
artifact through a repository you control.
