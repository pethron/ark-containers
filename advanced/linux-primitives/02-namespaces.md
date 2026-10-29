---
title: "Namespaces"
track: architecture
---

# Namespaces

Both copies of our service listened on port 8000, but they didn't fight over
that port. Give two ordinary programs the same address and port in one network
stack, and you will usually get a different result. What did Docker change?

It gave the processes different **network namespaces**. A namespace is a kernel
mechanism that gives a group of processes a particular view of a resource. It
doesn't copy the kernel, and it doesn't automatically apply a resource budget.
Let's separate those ideas before collecting a truckload of namespace names.

## Views belong to processes

Each process belongs to a namespace of each supported type. Children normally
inherit their parent's memberships, but a suitably authorized program can
create a new namespace or join an existing one. That is part of the work a
runtime performs before starting your application.

Namespace membership is visible through links such as `/proc/self/ns/net`.
Their targets include an identifier, for example `net:[4026533001]`. On the
same running kernel, matching identifiers for the same type mean the processes
share that namespace. The number isn't an address to connect to, a container
ID or a value to hard-code in a script.

## Which view are we changing?

| Namespace | What gets a separate view | What it does not promise |
|-----------|---------------------------|--------------------------|
| PID | Process identifiers and process visibility | A memory or CPU limit |
| Network | Interfaces, routes, sockets, port space and network-stack settings | An automatic route to the internet |
| Mount | Mount table and mount propagation relationships | A private copy of every underlying file |
| UTS | Hostname and NIS domain name | A DNS record or a network identity |
| IPC | System V IPC and POSIX message queues | Isolation of every possible communication channel |
| User | UID/GID mappings and capability scope | That every container uses user remapping |
| Cgroup | View of cgroup paths | A resource budget by itself |
| Time | Offsets for supported clocks, such as monotonic and boot-time clocks | A separate wall clock for every container |

Kernel support and runtime choices vary. In particular, ordinary Docker
containers do not necessarily get their own user or time namespace. Don't turn
the table into a claim that every row is enabled by default.

## A different mount table is not a copied disk

This distinction deserves a minute. A mount namespace controls which mounted
filesystems and paths a process sees. Two namespaces can still refer to the
same underlying files. Our read-only bind mount did exactly that: it made a
host file visible at a chosen container path.

The `readonly` option constrained writes through that mount. It did not prevent
the owner from changing the host file, and it did not package its contents into
the Python image. We will revisit this when we need durable application data.

Mount propagation adds another choice: whether later mount events propagate
between related mounts. In a manual namespace experiment, making mounts
private before changing them prevents those changes from leaking back to a
parent mount tree. That is why the sandbox kata explicitly performs that step.

## Sharing is a configuration, too

You don't need a second application to observe namespace sharing. In the
[Docker inspection lab](06-inspecting-namespaces-and-cgroups.md), two isolated
sleep processes will provide a quieter example. Docker normally separates
their network views, but a diagnostic process can be started with
`--network container:<name>` to join another container's network namespace.

That option shares the network stack, not the other container's filesystem or
PID namespace. A diagnostic container doesn't become "inside the whole
container" just because it can see the same interfaces.

The same care applies to host networking and host PID mode. They deliberately
remove a particular namespace boundary; they are not harmless troubleshooting
switches. We won't need them for the core exercises.

## Who can create or join one?

Namespace operations are permission-checked. On a suitable Linux system, user
namespaces can let an unprivileged user obtain capabilities within a newly
created namespace without becoming root in the initial host user namespace.
Other namespaces can then be owned by that user namespace.

This is part of how rootless tooling works, but it depends on kernel support,
distribution policy, UID/GID mappings and delegated resources. If `unshare`
returns `Operation not permitted`, inspect those prerequisites; don't solve it
by switching off security policy or adding `--privileged` to an unrelated
container.

## Back to our two services

The separate port spaces came from network namespaces. The different hostname
strings came from UTS configuration. Seeing only the service's process tree
came from a PID namespace and its corresponding `/proc` mount. None of those
observations proves that memory use was limited.

Before continuing, predict two outcomes: if we share a network namespace, can
both processes bind the same address and port? If we keep separate namespaces
but bind-mount the same writable file into both, will their writes be isolated?
Explain the mechanism rather than answering "because containers".

Next, [cgroups](03-cgroups-v2.md) deal with the resource question that namespaces
don't answer.

## Further reading

- [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html)
- [mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)
