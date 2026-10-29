---
title: "CRI and the wider ecosystem"
track: architecture
---

# CRI and the wider ecosystem

At this point, "runtime" has probably started appearing in far too many
sentences. Docker is called a container runtime, containerd is called a runtime,
and runc is called a runtime. Are they all doing the same thing?

No. The word is overloaded. Instead of memorizing a ranking of tools, ask which
interface a component serves and which responsibilities it owns.

## A map of responsibilities

| Component | Main role in this discussion |
|-----------|------------------------------|
| Docker CLI | Client of the Docker Engine API |
| Docker Engine | High-level container, image, network and volume management |
| Containerd | Content, snapshot and execution management for its clients |
| Shim and runc | Runtime integration, process supervision and low-level execution |
| Kubelet | Node agent reconciling workloads requested by Kubernetes |
| CRI | Kubernetes' interface to a container runtime service |
| Podman | Another engine/tooling approach for managing OCI containers |
| Nerdctl | A Docker-like CLI for containerd |
| Ctr | A lower-level administrative/debugging client for containerd |

This isn't a list of mandatory installations. The main course still needs
Docker, not every row in the table.

## Where CRI fits

The **Container Runtime Interface** is the API kubelet uses to ask a runtime
service for operations such as managing pod sandboxes, containers and images.
Containerd can serve CRI through its CRI integration; CRI-O is another
implementation designed for Kubernetes.

CRI is not the OCI runtime specification. Kubelet doesn't prepare an OCI bundle
and invoke runc directly for every request. It asks a runtime service to do
higher-level work, and that service arranges the lower-level execution.

The word *sandbox* here has a Kubernetes-specific role around pod execution.
It shouldn't be confused with our deliberately incomplete manual chroot
exercise, just because both use the same English word.

## Why removing dockershim didn't remove Docker images

Kubernetes historically had a built-in adapter called dockershim for Docker
Engine. That adapter was removed in Kubernetes 1.24. It did not mean images
built with Docker stopped being usable on Kubernetes nodes.

Image compatibility and node runtime integration are different contracts.
You can build a compatible application image with Docker and run it using a
CRI-enabled containerd service. Docker Engine integration, where needed, can
use a separate adapter such as cri-dockerd rather than the removed built-in
component.

This is a good test of the previous chapter: which contract moved the image,
and which contract asked a node to execute it?

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

Suppose Kubernetes cannot start a pod because its CRI endpoint is unavailable.
Running `docker ps` against some other engine on the node won't establish that
the CRI service works. Likewise, `ctr images ls` against an arbitrary namespace
doesn't prove that Docker lost an image.

First identify the manager, endpoint and object scope. Then inspect that
manager's evidence. This habit transfers much further than memorizing which
tool has the most similar `run` syntax.

Try the [runtime diagnosis kata](katas/README.md) to apply that map. The next
chapter is an optional direct-client comparison; you can skip it and continue
to [Running containers](../../02-running-containers/README.md).

## Further reading

- [Kubernetes CRI](https://kubernetes.io/docs/concepts/architecture/cri/)
- [Dockershim removal FAQ](https://kubernetes.io/blog/2022/02/17/dockershim-faq/)
- [Podman introduction](https://docs.podman.io/en/latest/)
- [Nerdctl](https://github.com/containerd/nerdctl)
