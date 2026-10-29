# Runtime architecture

**Optional advanced deep dive, not required to complete the core course or
its final project.** This is part of [Under the hood](../README.md).

This deep dive follows the tools that arrange Linux execution boundaries,
using the message service from module 01. Start with the engine walkthrough:
observing create, start and stop gives the component map a purpose.
If namespaces and resource controls are unfamiliar, consult
[Linux primitives](../linux-primitives/README.md) as needed.

## What you will learn

- dockerd → containerd → shim → runc
- OCI runtime, image and distribution specs
- CRI and the wider ecosystem; where Podman fits
- Optional advanced practice with nerdctl and ctr, after the Docker-based explanation

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [The Docker engine](01-the-docker-engine.md) | A |
| 02 | [containerd and the shim](02-containerd-and-the-shim.md) | A |
| 03 | [runc and the OCI runtime spec](03-runc-and-the-oci-runtime-spec.md) | A |
| 04 | [OCI image and distribution specs](04-oci-image-and-distribution-specs.md) | A |
| 05 | [CRI and the wider ecosystem](05-cri-and-the-wider-ecosystem.md) | A |
| 06 | [docker, nerdctl and ctr side by side](06-docker-nerdctl-and-ctr-side-by-side.md) (optional advanced lab) | R |

## Katas

- [Diagnose client, runtime-start and application failures](katas/README.md)
- Compare nerdctl's service with containerd metadata and tasks in the optional
  advanced chapter. Its standalone VM prerequisites are separate from Docker.

## Before moving on

Explain the request path from Docker CLI to application process, and identify
who owns the object at each layer. Distinguish OCI runtime configuration, OCI
image content and CRI requests without using "runtime" for all three.

Continue with [Running containers](../../02-running-containers/README.md) for
operations, or return to your place in the guided course if you came here
after another module.
