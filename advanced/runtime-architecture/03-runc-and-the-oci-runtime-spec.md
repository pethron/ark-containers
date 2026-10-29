---
title: "runc and the OCI runtime spec"
track: architecture
---

# runc and the OCI runtime spec

In the manual sandbox, we chose a filesystem, entered namespaces and started a
program. A production runtime has to do that reliably across many combinations
of credentials, mounts, resource controls and policy. A shell script with a
chroot is not quite the whole job, huh?

The **OCI Runtime Specification** defines a contract for configuring and
managing a container at this level. **Runc** is one implementation of that
contract, not the name of the specification and not a replacement for Docker's
whole feature set.

## The runtime consumes a bundle

An OCI filesystem bundle contains a `config.json` file and the filesystem
content referenced by that configuration. For a typical Linux application,
the configuration describes what to execute and how to set up its environment.

For example, the runtime needs to know:

- process arguments, environment and working directory;
- numeric user and group credentials;
- the root filesystem path and mount layout;
- namespace configuration;
- resource constraints and security settings;
- which capabilities and syscall policy to apply.

This is not a Dockerfile. A Dockerfile describes a build, and the resulting
image contains distributable content and image configuration. The manager
preparing a container combines that content with runtime choices to produce
the execution configuration.

Our first service demonstrates why both inputs matter. The image named Python
as an available executable, but the launch command supplied the source mount,
UID, host port and message. A single image can support many such executions.

## Create is not the same as start

The OCI lifecycle distinguishes states such as `creating`, `created`, `running`
and `stopped`, with operations to create, start, signal, inspect and delete a
container. In particular, preparing a container doesn't mean its application
has already begun doing useful work.

The engine API has its own lifecycle model too. Don't assume Docker's object
states are identical to the runtime's internal states at every instant.
A Docker object can exist before a low-level execution has been created, and
can remain after that execution has ended.

This separation matters for errors. Failing to prepare a mount or apply runtime
configuration can prevent the application from starting at all. In that case,
empty application logs aren't surprising: there was no application process
available to write them.

## Map the first command to runtime work

| Our request | Work needed before or during execution |
|-------------|-----------------------------------------|
| `python -u /app/app.py` | Set process arguments and start the executable |
| `--user 65534:65534` | Set credentials |
| Read-only source mount | Prepare a mount with the requested access mode |
| Private PID/network views | Arrange namespace membership |
| Memory and PID limits | Configure resource controls through cgroups |
| Capability and seccomp policy | Apply privilege and syscall constraints |

Host port publishing also needs engine/networking setup. It isn't a magical
side effect of the Python executable or a promise that the OCI runtime spec
implements Docker's entire networking experience.

Likewise, image pulling, registry credentials, build caching and application
restart policy belong to other layers of the system. Runc doesn't download
the Python image from Docker Hub and then decide what your application needs.

## The executable runs against the host kernel

After setup, the application makes Linux system calls against the host kernel.
An ordinary runc container doesn't introduce a guest kernel. That is the
connection back to the Linux primitives deep dive: namespaces and cgroups are kernel mechanisms
configured by runtime machinery, not features implemented by Python.

Other runtime integrations can use different isolation models, including a
userspace kernel or a lightweight VM. OCI compatibility describes a contract;
it doesn't make all implementations' performance and isolation properties
identical. Evaluate the actual runtime and host configuration.

## Why we aren't running runc as root here

You can use runc directly with a prepared bundle, but then you are responsible
for safely preparing its root filesystem, privileges, mounts and lifecycle.
That is useful runtime-development work, not necessary to operate the service
we already have.

The manual sandbox exposed enough setup to explain the responsibility. Our
main runtime lab will keep Docker as the owner and inspect its observations
rather than extracting private engine files and replaying them as root.

Before moving on, explain why these are different requests: "build an image",
"create an OCI execution environment", and "restart a failed application".
Which component would you investigate first if a runtime setup error appeared
before Python produced any log?

Next, [image and distribution specifications](04-oci-image-and-distribution-specs.md)
describe what happens before the runtime receives its prepared filesystem.

## Further reading

- [OCI runtime spec](https://github.com/opencontainers/runtime-spec)
- [OCI filesystem bundle](https://github.com/opencontainers/runtime-spec/blob/main/bundle.md)
- [Runc](https://github.com/opencontainers/runc)
