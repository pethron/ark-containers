# 03: Images and registries

Your colleague needs the same runtime artifact you tested, not whatever a tag
points to tomorrow. Start by identifying and transferring the current Python
image, then follow that content through layers, digests and a loopback registry.

The application still comes from a source mount. This module makes delivery
identity explicit; module 04 packages the code into our own image.

## What you will learn

- Layers, union mounts and OverlayFS
- Content addressing: digests, manifests, multi-arch indexes
- Tags vs digests; how registries distribute images

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Identify and transfer an image](01-identify-and-transfer-an-image.md) | R |
| 02 | [Image content and writable layers](02-image-content-and-layers.md) | A |
| 03 | [Digests, manifests and multi-arch images](03-digests-manifests-and-multi-arch-images.md) | A |
| 04 | [Run a local registry](04-run-a-local-registry.md) | R |
| 05 | [Registry contracts and authentication](05-registry-contract-and-authentication.md) | A |
| 06 | [Platforms and execution compatibility](06-platforms-and-compatibility.md) | A |

## Katas

- [An artifact for another environment](katas/README.md): recover a missing
  reference, justify the platform selection and verify a registry handover.

## Before moving on

Explain the difference between a moving tag, an index digest, a platform
manifest and a local image ID. Show which identity your handover actually
checked and why a matching version string wasn't enough.

For deeper contracts, the optional [OCI image and distribution chapter](../advanced/runtime-architecture/04-oci-image-and-distribution-specs.md)
connects the objects. You don't need OCI runtime setup or a second client to
complete this module.

Next, [Building images](../04-building-images/README.md), where the application
code finally travels inside its own image.
