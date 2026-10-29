---
title: "cgroups v2"
track: architecture
---

# cgroups v2

Our service has its own process view and its own port space. Great. Does that
mean it can only consume a small amount of memory? Unfortunately, no: a private
view of the machine is not a reservation or a spending limit.

**Control groups**, usually shortened to cgroups, let the kernel account for and
control resources used by groups of processes. Docker translates resource
settings into this machinery. We'll inspect a small bounded example rather
than trying to exhaust your laptop to prove that limits exist.

## A hierarchy, not one switch

Cgroup v2 organizes processes into a unified hierarchy. Controllers enforce
particular kinds of policy, and a child group is constrained by its ancestors.
A container cannot escape a parent's memory ceiling merely by requesting a
larger limit for itself.

The hierarchy is exposed through a filesystem, usually mounted at
`/sys/fs/cgroup`. Files let authorized software read accounting values and
configure limits. On a native Linux host, systemd often manages this tree, so
manually creating groups wherever you like can conflict with the service
manager. Prefer Docker settings or a delegated systemd scope for our labs.

Cgroup v1 also exists, with different files and controller layouts. This module's
file-level examples require v2; first check `docker info` rather than guessing
from your distribution name. Inside a cgroup namespace, `/proc/self/cgroup`
may show `0::/`: that slash is relative to the namespace view, not proof that
the process belongs to the host's unrestricted root group.

## Read the control, then its effect

| Interface | What to look for |
|-----------|------------------|
| `memory.max` | Hard memory ceiling in bytes, or `max` |
| `memory.current` | Current accounted memory, not just Python's heap |
| `memory.events` | Counters including limit hits and OOM-related events |
| `cpu.max` | CPU quota and period, or `max` plus a period |
| `cpu.stat` | Usage and throttling accounting |
| `pids.max` | Maximum tasks in the group; threads count too |
| `pids.current` | Currently accounted tasks |
| `io.stat` | Block-I/O accounting where supported |
| `io.max` | Per-device bandwidth or IOPS ceilings where supported |

These are not all interchangeable "limits". A weight influences competition
with sibling groups; a quota imposes a budget over time. Some controllers need
host configuration or delegation before a rootless engine can use them.

I/O policy also depends on the underlying block device and storage path.
A buffered filesystem write, a direct block-device operation and a remote
filesystem don't necessarily produce the same accounting behavior. Don't
promise a portable disk throughput ceiling from a setting you haven't
verified on the actual storage backend.

## Half a CPU is a time budget

With `--cpus 0.5`, Docker asks for roughly half a CPU's worth of execution time
over the configured scheduling period. A common representation is
`50000 100000` in `cpu.max`: 50,000 microseconds of quota per 100,000-microsecond
period. Treat that as an illustrative value, not a mandatory period.

This does not pin the application to a particular core, nor promise that it
always receives that much time. It may run on different allowed CPUs and can
still wait behind other work. CPU affinity, shares or weights, and quota answer
different questions.

If the application isn't busy, you won't see dramatic throttling. That's fine:
reading a configured ceiling and observing it under sustained load are two
different experiments. Module 02 will connect those counters to operational
symptoms.

## Memory isn't just the language heap

A memory cgroup accounts for more than allocations made by Python's object
allocator. Depending on the resource, page cache and kernel memory also enter
the picture. An application can therefore run into a container memory limit
before its own heap metric reaches that number.

When reclaim cannot satisfy a hard limit, a cgroup OOM can lead the kernel to
kill a process. That is different from the engine politely asking the
application to stop. Exit code 137 is consistent with `SIGKILL`, but doesn't
prove OOM on its own: a manual forced kill can produce it too. Inspect
`memory.events`, engine state and logs before naming the cause.

Swap needs separate attention. A memory setting is not automatically a
description of all permitted memory-plus-swap behavior. In the bounded lab we
set Docker's memory and memory-plus-swap values equally to disallow container
swap when the host supports that control, then verify the exposed limits.

## What's available in your environment?

Docker Desktop adds a VM-wide resource budget above container groups. A Linux
VM in a cloud account has its own outer limits too. A container's local
configuration cannot create capacity the surrounding environment doesn't have.

Rootless engines depend on cgroup v2 delegation and a suitable service-manager
setup for these controls. If the engine warns that a setting isn't supported,
that warning is the result of the exercise, not permission to pretend the
limit applied.

In the [inspection lab](06-inspecting-namespaces-and-cgroups.md), read the
configured values alongside Docker's request. Then explain why namespaces
alone wouldn't have imposed any of those budgets.

## Before moving on

If you came from the core [resource-failure chapter](../../02-running-containers/06-resource-usage-and-failure.md),
return to its OOM and explicit-kill comparison. Which additional accounting
would help you distinguish memory pressure from a shutdown timeout in a real
service? Don't repeat a memory-exhaustion experiment without its small limits.

Your colleague proposes separate network namespaces as protection against a
runaway memory allocation. What problem does that solve, and what is missing?
Now suppose a container has a 64 MiB limit inside a VM with a 2 GiB limit.
Which boundary could affect it first?

Next, [credentials and security policy](04-capabilities-seccomp-and-lsms.md)
explain why resource budgets still don't answer what a process may do.

## Further reading

- [Kernel cgroup v2 guide](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html)
- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
