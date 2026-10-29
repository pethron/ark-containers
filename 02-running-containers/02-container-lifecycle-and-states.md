---
title: "Container lifecycle and states"
track: architecture
---

# Container lifecycle and states

The service stopped cleanly, but its name was still in `docker ps -a`.
Did Docker forget to clean up? No: stopping execution and removing the container
are separate requests. That distinction is useful when you're trying to
understand a failure rather than erase its evidence.

## An object can exist without a running process

An image is the packaged input. A container is an engine object created from
that input and a configuration, with its own execution lifecycle and writable
filesystem state. `docker create` prepares the object; `docker start` starts
its main process. `docker run` combines those actions and, unless detached,
attaches the client to its streams.

The common states tell us different things:

| State | Useful interpretation |
|-------|-----------------------|
| `running` | Main process is executing; HTTP readiness is a separate question |
| `exited` | Execution ended; configuration, logs and writable state may remain |

These are engine states, not your application's own state machine. A server can
be accepting sockets but failing every request, or running normally while the
published target port is wrong. You have already met the second case.

## Restart isn't replacement

Continue from the previous chapter's stopped `ark-ops`:

```text
docker start ark-ops
docker exec ark-ops sh -c 'echo temporary-instance-state > /tmp/ark-note'
```

`docker exec` runs an extra command inside the running container. Here we use
its shell to write a small note in `/tmp`, outside the read-only course mount.
Now restart and read it:

```text
docker restart ark-ops
docker exec ark-ops cat /tmp/ark-note
```

The note remains after restart. We wrote into the container's writable layer,
not the read-only source mount. Restarting uses its existing environment,
command, mounts and other creation settings; it isn't a fresh deployment of a
changed tag or shell variable.

A recreate operation removes the old object and creates another. Unless you
put data in an explicitly persistent mount, the old writable-layer contents
won't appear in its replacement. That is why a successful `restart` isn't a
backup strategy.

## What survives which action?

| Item | Stop/start | Remove container |
|------|------------|------------------|
| Image content in the local cache | Remains | Remains unless separately removed |
| Container writable layer | Remains | Removed |
| Host bind-mounted source file | Remains | Remains |
| Named volume | Remains | Normally remains; manage its lifecycle explicitly |
| Main process memory and open requests | Lost when process exits | Not retained |

The mount's target path doesn't tell you its lifetime. `/app` might be image
content, a bind mount or a volume in different deployments. Inspect the mounts
before deciding what a cleanup command will delete.

## Keep evidence long enough to use it

`--rm` is handy for a short diagnostic command, but it automatically removes
the container when it exits. That can discard precisely the state you wanted
to inspect after a failure. For our incident fixtures, keep the stopped object
until you've read its state and logs.

Likewise, `docker rm -f` is not a nicer spelling of graceful shutdown: it can
forcibly end running work. In the normal procedure, ask the application to stop,
check the result, then remove the object.

Predict what will survive before cleaning up:

```text
docker stop ark-ops
docker rm ark-ops
```

The note is gone with that instance, while your original application files and
image stay. The [root filesystem deep dive](../advanced/linux-primitives/05-root-filesystems-chroot-and-pivot-root.md)
explains how the view is assembled if you want the kernel-level detail.

Next, [configure and replace an instance](03-configure-and-replace.md). You'll
use a deliberate startup error to distinguish configuration from execution.
