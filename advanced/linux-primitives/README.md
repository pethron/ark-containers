# Linux primitives

**Optional advanced deep dive, not required to complete the core course or
its final project.** This is part of [Under the hood](../README.md), not a
numbered step between the introduction and container operations.

The first service worked. Now let's find out what "its own environment" really
meant: a process with different views, a prepared filesystem and a chosen set
of permissions, still asking the host kernel to do the work.

Start with the [inspection lab](06-inspecting-namespaces-and-cgroups.md):
run its first two steps and keep the observations nearby while reading
chapters 01–05. Then return to the resource and permission checks with a better
explanation of what you're measuring.

You can take this deep dive after module 01 whenever the mechanisms interest
you. You don't need to master it before continuing to
[Running containers](../../02-running-containers/README.md).

## What you will learn

- Namespaces: pid, net, mnt, uts, ipc, user, cgroup
- cgroups v2: cpu, memory, io, pids
- Capabilities, seccomp, AppArmor/SELinux

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [A container is just a process](01-a-container-is-just-a-process.md) | A |
| 02 | [Namespaces](02-namespaces.md) | A |
| 03 | [cgroups v2](03-cgroups-v2.md) | A |
| 04 | [Capabilities, seccomp and LSMs](04-capabilities-seccomp-and-lsms.md) | A |
| 05 | [Root filesystems, chroot and pivot_root](05-root-filesystems-chroot-and-pivot-root.md) | A |
| 06 | [Inspecting namespaces and cgroups](06-inspecting-namespaces-and-cgroups.md) | R |

## Katas

- [Review a boundary claim, then optionally build a manual sandbox](katas/README.md)

The Docker inspection lab works with Linux containers on Desktop or native
Engine. The manual sandbox needs a disposable Linux VM with systemd and root
access; its prerequisites and intentionally missing protections are explicit.

## Before moving on

Explain why two services can share one kernel but have different port spaces,
and why that says nothing about a memory budget. Use observations from the lab,
not just the definitions.

Next, [Runtime architecture](../runtime-architecture/README.md) follows the
tools that arrange these mechanisms when you type `docker run`.
