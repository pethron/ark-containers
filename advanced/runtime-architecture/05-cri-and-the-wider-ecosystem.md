---
title: "CRI and the wider ecosystem"
track: architecture
---

# CRI and the wider ecosystem

At this point, "runtime" has probably started appearing in far too many
sentences. Docker is called a container runtime, containerd is called a runtime,
and runc is called a runtime. Are they all doing the same thing?

Each name covers a different set of responsibilities. Following the interface
a component serves gives us a more useful map than ranking everything called
a runtime.

## A map of responsibilities

| Component | Main role in this discussion |
|-----------|------------------------------|
| Docker CLI | Client of the Docker Engine API |
| Docker Engine | High-level container, image, network and volume management |
| Containerd | Content, snapshot and execution management for its clients |
| Shim and runc | Runtime integration, process supervision and low-level execution |
| Podman | Another engine/tooling approach for managing OCI containers |
| Nerdctl | A Docker-like CLI for containerd |
| Ctr | A lower-level administrative/debugging client for containerd |

These are alternatives or components to understand, not a list to install.
The main course continues to use the Docker setup you already have.

## Where Podman differs

Podman offers familiar container and image commands, often without a central
long-running rootful engine daemon in the local CLI workflow. It can also
provide an API service and supports remote-client arrangements, so "daemonless"
shouldn't be read as "there are never any supporting services or processes".

Podman supports rootless use and OCI-oriented tooling. Docker also supports a
rootless engine configuration; rootless is a privilege arrangement, not a brand.
Both approaches still depend on the host's available kernel features and
resource delegation.

Choose based on your operating environment, integration needs, API assumptions
and team workflow. We won't silently substitute Podman commands in Docker
labs and assume every flag, Compose integration or socket behavior is identical.

## Why nerdctl isn't a lighter Docker installation

Nerdctl provides a Docker-like interface over containerd. Depending on the task,
you also need networking plugins, a builder or other supporting setup.
Familiar command spelling doesn't make all of Docker's defaults and integrations
appear automatically.

Ctr exposes more of containerd's own object model. It is useful for focused
inspection and administration, but isn't intended as a drop-in application
workflow matching every Docker feature.

That is why direct containerd use is an advanced extension here. It adds
ownership and setup questions before it removes anything the first service
needed. Use it when that layer is what you want to study, not because a shorter
component diagram necessarily means an easier learning path.

## Choose the next useful observation

Suppose your Docker CLI is pointed at a different context from the one where
you started the service. Its empty `docker ps` result describes that endpoint,
not every engine on the machine. Similarly, `ctr images ls` against an
arbitrary containerd namespace doesn't prove that Docker lost an image.

First identify the manager, endpoint and object scope. Then inspect that
manager's evidence. This habit transfers much further than memorizing which
tool has the most similar `run` syntax.

Try the [runtime diagnosis kata](katas/README.md) to apply that map. The next
chapter is an optional direct-client comparison; you can skip it and continue
to [Running containers](../../02-running-containers/README.md).

## Beyond the local engine

You may also encounter **CRI**, the Container Runtime Interface used by
Kubernetes' node agent to request container and image operations from a runtime
service. Containerd can provide that integration. OCI defines image and
low-level execution contracts; CRI defines another client's service interface.
Keeping those contracts separate explains how an image built with Docker can
be used by another compatible runtime.

That is the ecosystem context we need here. Cluster setup, pod operations and
Kubernetes troubleshooting remain outside this course.

## Further reading

- [Kubernetes CRI](https://kubernetes.io/docs/concepts/architecture/cri/)
- [Podman introduction](https://docs.podman.io/en/latest/)
- [Nerdctl](https://github.com/containerd/nerdctl)
