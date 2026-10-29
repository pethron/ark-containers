# 01 — Why containers

## What you will learn

- Start a small HTTP application, change its configuration, and verify its response
- Diagnose a connection failure using service state, logs, and port mappings
- Adapt the example to run a second, independently configured instance
- From physical servers to VMs to containers
- chroot, FreeBSD jails, LXC, Docker, OCI: a short history
- VM vs container: isolation, density, startup, trade-offs

## Start with the whole task

You need to hand a colleague a working HTTP service without asking them to install
its runtime. First run the supplied application, make a change, and recover from
a controlled failure. Then investigate how this delivery model fits into the
history of virtualization and what it does, and does not, isolate.

Read chapters 01–03 for the first experience. Chapters 04–06 return to that result
with deeper questions. Only one Docker setup is required to begin; the containerd
path is an optional extension, not a prerequisite. Start with `docker run`;
compare it with Compose only after encountering repeated launch options.

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [The problem containers solve](01-the-problem-containers-solve.md) | A |
| 02 | [Installing Docker and containerd](02-installing-docker-and-containerd.md) | R |
| 03 | [Your first application](03-your-first-application.md) | R |
| 04 | [From physical servers to virtual machines](04-from-physical-servers-to-virtual-machines.md) | A |
| 05 | [A short history of isolation: chroot to OCI](05-a-short-history-of-isolation-chroot-to-oci.md) | A |
| 06 | [Virtual machines vs containers](06-virtual-machines-vs-containers.md) | A |

## Practice and transfer

Chapter 03 includes a controlled failure with progressive hints and a less-guided
two-instance task. Success means checking the intended responses and explaining
the evidence, not merely getting a container into a running state.

The supplied service and its deliberate shortcuts are documented in
[`first-app/`](first-app/). Each exercise includes cleanup scoped to its named
containers or Compose project.

Standalone katas are still planned; the embedded exercises are available now.

## Revisit

The later chapters recall the first experiment and revisit its isolation
boundaries. On a later study session, explain from memory why a running container
can still be unreachable, then confirm your explanation against the configuration.
You can compare explanations with a peer or write them down on your own.

Modules 02–03 provide deeper mechanisms; module 04 continues application
operations. They are different next questions, not a requirement to master all
the internals before continuing to use containers.
