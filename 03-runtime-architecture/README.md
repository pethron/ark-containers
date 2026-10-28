# 03 — Runtime architecture

## What you will learn

- dockerd → containerd → shim → runc
- OCI runtime, image and distribution specs
- CRI, nerdctl, ctr; where Podman fits

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [The Docker engine](01-the-docker-engine.md) | A |
| 02 | [containerd and the shim](02-containerd-and-the-shim.md) | A |
| 03 | [runc and the OCI runtime spec](03-runc-and-the-oci-runtime-spec.md) | A |
| 04 | [OCI image and distribution specs](04-oci-image-and-distribution-specs.md) | A |
| 05 | [CRI and the wider ecosystem](05-cri-and-the-wider-ecosystem.md) | A |
| 06 | [docker, nerdctl and ctr side by side](06-docker-nerdctl-and-ctr-side-by-side.md) | R |

## Katas

In [`katas/`](katas/). Planned:

- Same image on three CLIs
- Find the shim and runc processes
