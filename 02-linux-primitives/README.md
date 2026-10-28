# 02 — Linux primitives

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

In [`katas/`](katas/). Planned:

- Build a container by hand with unshare, cgroups and chroot
