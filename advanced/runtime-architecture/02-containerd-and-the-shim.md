---
title: "containerd and the shim"
track: architecture
---

# containerd and the shim

The last chapter followed a Docker object from `created` to `running` and then
to removal. Underneath that model, someone has to keep track of the actual
process, collect its exit status and manage its filesystem state. That work
doesn't disappear when we stop looking at the CLI.

Containerd is a service that manages container execution and related content.
Docker uses it internally, but containerd can also be used by other clients.
Sharing a component does not mean all those clients share one application model.

## Content, snapshots, metadata and tasks

It helps to separate four kinds of state:

| State | What it represents |
|-------|--------------------|
| Content | Addressed blobs, including image manifests, configuration and layers |
| Snapshots | Unpacked filesystem state prepared by a snapshotter |
| Container metadata | A containerd record with configuration and references |
| Task | A live execution instance, with process and lifecycle operations |

An image can be present without a running task. A container metadata record can
outlive its task. A task exit doesn't automatically imply all referenced image
content was deleted. These distinctions explain why lower-level tools expose
more objects than `docker ps` suggests.

Depending on Docker's storage configuration, image handling may involve its
containerd image store or another engine storage path. Don't assume every
Engine installation has identical content and snapshot plumbing just because
its execution path uses containerd.

## What the shim does

With the standard runtime-v2 design, containerd communicates with a **shim**
that manages runtime operations and supervises the workload. For the common
runc-based path, this is typically a `containerd-shim-runc-v2` process.

The shim can keep responsibility for the workload's process lifecycle, I/O
plumbing and exit reporting without keeping the short-lived `runc` command
running beside it forever. This decouples process supervision from the central
containerd daemon.

The grouping isn't a universal "one shim for every process" rule. Runtime and
integration choices can group workloads differently. Likewise, discovering a
shim process isn't enough to identify which manager owns the workload.

## Why runc may be missing from ps

Runc performs lifecycle operations such as creating or starting a container
process and then returns. When Python is quietly serving requests, the runtime
command that set it up may already have exited. The application and shim remain.

So if you cannot see a long-running `runc` process, that isn't evidence that
the engine skipped OCI runtime setup. You're looking for the result of a
short-lived operation after the operation has finished.

On a native Linux engine host, while the service from the previous lab is
running, read the process inventory:

```bash
sudo ps -eo pid,ppid,comm,args --forest
```

Find dockerd, containerd, the relevant shim and the Python process. Use the
engine-reported container ID and PID to correlate them; don't guess from the
first process containing the word `python`. Output layouts and service ancestry
vary. On Desktop, use Docker's process inspection instead; don't modify its VM
to obtain a prettier process tree.

## Does a daemon restart kill the application?

There are several daemons and several kinds of restart here. A shim's design
can allow workload supervision to survive a containerd daemon restart, but that
doesn't make every Docker shutdown harmless. By default, Docker daemon
termination stops its running containers; Docker's **live restore** changes
that behavior within documented conditions.

Engine configuration, service-manager policy, runtime behavior and the kind of
upgrade all matter. Container restart policies are another feature again.
"The process is decoupled" is an architectural property, not a promise that
any maintenance action will preserve the service.

We won't restart your engine to demonstrate this. Other people's containers
may be running there, and an introductory inspection lab has no reason to
interrupt them.

## Two unrelated meanings of namespace

A **containerd namespace** separates API metadata for different consumers, such
as clients with different ownership. It is not a Linux PID or network namespace.
Choosing one does not itself isolate process credentials, sockets or memory.

Even when tools can reach a daemon and list its objects, they shouldn't mutate
objects behind another manager's back. In particular, do not point ctr or
nerdctl at Docker's private containerd socket, and do not clean up
Kubernetes-managed tasks manually because they look abandoned.

The [advanced client comparison](06-docker-nerdctl-and-ctr-side-by-side.md)
uses a standalone daemon in a disposable VM with its own lab namespace.
You do not need that setup for the main course.

## Before moving on

After an application exits, what could still exist: its image content, a
container metadata record, a shim, a live task? Which answers require observing
the actual cleanup behavior rather than assuming it?

Next, [runc and OCI runtime configuration](03-runc-and-the-oci-runtime-spec.md)
connect these jobs to the Linux mechanisms from the Linux primitives deep dive.

## Further reading

- [containerd runtime v2](https://github.com/containerd/containerd/blob/main/docs/runtime-v2.md)
- [containerd namespaces](https://github.com/containerd/containerd/blob/main/docs/namespaces.md)
- [Docker live restore](https://docs.docker.com/engine/daemon/live-restore/)
