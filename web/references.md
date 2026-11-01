# References and versions

The course explains each idea at the moment an exercise needs it, so most
chapters cite little. This page collects the sources behind those
explanations, for when you want to read the original specification, check a
historical claim or go further than the course does. The chapters on history
and the **Under the hood** deep dives end with their own *Further reading*,
which this page doesn't repeat entry by entry.

## Software versions

The exercises were last checked on **31 October 2026** with these versions.
Commands and outputs can differ slightly with other releases; when they do,
the chapters explain what to look for rather than an exact match.

| Component | Version checked |
|-----------|-----------------|
| Docker Engine | 29.6.1, with the containerd image store |
| Docker Compose | v5.3.0 |
| Course image used in modules 01–03 | `ghcr.io/pethron/ark-message:1`, built from `04-building-images/message-service` |
| Base image of the core exercise services | `python:3.12-alpine` |
| Advanced Compose API base image | `python:3.13.7-slim` |
| Advanced Compose database | `postgres:17.6-alpine` |
| Advanced Compose disposable cache | `redis:7.4.5-alpine` |
| Advanced Compose proxy | `nginx:1.28.0-alpine` |

The [preview status](preview-status.md) page lists the platforms and shells
the exercises have been run on, and those that haven't been checked yet.

Selected terminal images are rendered from actual command output. Their IDs
and timings belong to the recorded run; compare the relationships and results
rather than copying those values.

## Specifications

- Open Container Initiative,
  [Image Format Specification](https://github.com/opencontainers/image-spec),
  [Runtime Specification](https://github.com/opencontainers/runtime-spec) and
  [Distribution Specification](https://github.com/opencontainers/distribution-spec).
  The three documents that let different tools build, store and run the same
  containers.
- Open Container Initiative,
  [About the OCI](https://opencontainers.org/about/overview/). Why the
  specifications exist and who maintains them.
- [Compose Specification](https://github.com/compose-spec/compose-spec). The
  format behind `compose.yaml`.
- Peter Mell and Timothy Grance,
  [The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final),
  NIST SP 800-145, 2011.

## Virtualization and isolation

- Gerald J. Popek and Robert P. Goldberg, "Formal Requirements for
  Virtualizable Third Generation Architectures", *Communications of the ACM*
  17(7), 1974, [doi:10.1145/361011.361073](https://doi.org/10.1145/361011.361073).
- R. J. Creasy, "The Origin of the VM/370 Time-Sharing System", *IBM Journal
  of Research and Development* 25(5), 1981,
  [doi:10.1147/rd.255.0483](https://doi.org/10.1147/rd.255.0483).
- Keith Adams and Ole Agesen, "A Comparison of Software and Hardware
  Techniques for x86 Virtualization", *ASPLOS XII*, 2006,
  [doi:10.1145/1168857.1168860](https://doi.org/10.1145/1168857.1168860).
- Daniel Price and Andrew Tucker, "Solaris Zones: Operating System Support
  for Consolidating Commercial Workloads", *LISA '04*, USENIX, 2004.
- FreeBSD, [jail(8)](https://man.freebsd.org/cgi/man.cgi?query=jail&sektion=8).
- Michael Kerrisk, [Namespaces in operation, part 1](https://lwn.net/Articles/531114/),
  LWN.net, 2013.

## Linux interfaces

The Linux manual pages are the reference for the kernel features containers
are built on.

- [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html)
- [chroot(2)](https://man7.org/linux/man-pages/man2/chroot.2.html)
- [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html)
- [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)

## Docker documentation

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
- [Storage drivers](https://docs.docker.com/engine/storage/drivers/) and
  [the containerd image store](https://docs.docker.com/engine/storage/containerd/)
- [Volumes](https://docs.docker.com/engine/storage/volumes/),
  [bind mounts](https://docs.docker.com/engine/storage/bind-mounts/) and
  [tmpfs mounts](https://docs.docker.com/engine/storage/tmpfs/)
- [Networking overview](https://docs.docker.com/engine/network/)
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/) and
  [build cache](https://docs.docker.com/build/cache/)
- [Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Docker Hub publication](https://docs.docker.com/docker-hub/repos/manage/hub-images/push/)
  and [login and credential stores](https://docs.docker.com/reference/cli/docker/login/)
- [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/),
  [Watch](https://docs.docker.com/compose/how-tos/file-watch/) and
  [file-mounted secrets](https://docs.docker.com/compose/how-tos/use-secrets/)
- Official image documentation for [Postgres](https://hub.docker.com/_/postgres),
  [Redis](https://hub.docker.com/_/redis) and [Nginx](https://hub.docker.com/_/nginx)
- [Nginx upstream resolution](https://nginx.org/en/docs/http/ngx_http_upstream_module.html),
  including the shared-zone and `resolve` requirements used by the application
- [Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
- [Docker Engine security](https://docs.docker.com/engine/security/) and
  [isolating containers with a user namespace](https://docs.docker.com/engine/security/userns-remap/)

## Course inspiration and further practice

- Jami Kousa and contributors, University of Helsinki,
  [DevOps with Docker, Fall 2026](https://courses.mooc.fi/org/uh-cs/courses/devops-with-docker-fall-2026).
  A source of teaching inspiration for the course's ongoing development,
  with further exercises on Docker, Compose, image optimization and deployment.
  The course material is licensed under
  [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/).

## History of Docker

- Docker, [Docker 0.9: introducing execution drivers and libcontainer](https://www.docker.com/blog/docker-0-9-introducing-execution-drivers-and-libcontainer/), 2014.
- [LXC](https://github.com/lxc/lxc), the Linux Containers project that early
  Docker releases used to start containers.

## Platforms

- Microsoft, [Comparing WSL 1 and WSL 2](https://learn.microsoft.com/windows/wsl/compare-versions).
  How Docker Desktop on Windows gets a Linux kernel.
- Microsoft, [Isolation modes for Windows containers](https://learn.microsoft.com/virtualization/windowscontainers/manage-containers/hyperv-container),
  for the Windows containers this course doesn't cover.
