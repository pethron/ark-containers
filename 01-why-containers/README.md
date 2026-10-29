# 01: Why containers

## What you will learn

- Start a small HTTP application, change its configuration, and verify its response
- Diagnose a connection failure using service state, logs, and port mappings
- Adapt the example to run a second, independently configured instance
- From physical servers to VMs to containers
- chroot, FreeBSD jails, LXC, Docker, OCI: a short history
- VM vs container: isolation, density, startup, trade-offs

## Where we start

You need to hand a colleague a working HTTP service without asking them to install
its runtime. First run the supplied application, make a change, and recover from
a controlled failure. Then investigate how this delivery model fits into the
history of virtualization and what it does, and does not, isolate.

Start with chapters 01–03 to get the application running. Then chapters 04–06
explain how we got here and what separates a container from a VM. We'll use
Docker and `docker run`; Compose comes later, when we connect several services.

Use Bash on Linux or PowerShell 7 on Windows. The
[installation chapter](02-installing-docker.md) explains the setup; command tabs
in the application walkthrough remember your shell choice across pages.
You don't need prior Linux administration experience: mounts and ports are
introduced when the application needs them; user configuration comes later.

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [The problem containers solve](01-the-problem-containers-solve.md) | A |
| 02 | [Installing Docker](02-installing-docker.md) | R |
| 03 | [Your first application](03-your-first-application.md) | R |
| 04 | [From physical servers to virtual machines](04-from-physical-servers-to-virtual-machines.md) | A |
| 05 | [A short history of isolation: chroot to OCI](05-a-short-history-of-isolation-chroot-to-oci.md) | A |
| 06 | [Virtual machines vs containers](06-virtual-machines-vs-containers.md) | A |

## What you'll try

In chapter 03, you'll change the application's message, break its connection
and get it working again. Then you'll try running a second copy alongside it.
There are hints if you get stuck, but try using the logs before opening them.

The supplied service and its deliberate shortcuts are documented in
[`first-app/`](first-app/). Each exercise includes cleanup scoped to its named
containers. The [handover kata](katas/README.md) asks you to repeat the delivery
with less guidance and a different requirement.

## Before moving on

When you return for the next session, try explaining why the container kept
running when you couldn't reach the application. Then check your explanation
against the launch command. If you're studying with someone, compare answers.

Next in the core course is [Running containers](../02-running-containers/README.md).
You'll keep the same HTTP behavior, add explicit shutdown handling, and learn
to tell configuration failures, forced kills and memory failures apart.
The optional [Under the hood](../advanced/README.md) deep dives explore Linux
and runtime mechanisms when you're curious. They are not required to complete
the course or its final project.
