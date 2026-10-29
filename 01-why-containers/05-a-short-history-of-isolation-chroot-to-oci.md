---
title: "A short history of isolation: chroot to OCI"
track: architecture
---

# A short history of isolation: chroot to OCI

In our application exercise, Docker did quite a bit of work for one command. It prepared a filesystem, started the process, and connected a port so we could reach it. Did Docker invent all of that, or was it putting existing pieces together?

Not quite. The idea of giving a process a restricted environment is much older, and several operating systems developed their own versions of it. Docker's contribution was to make packaging, sharing, and running applications fit into a workflow that developers could actually use every day.

Let's follow that history far enough to see where the pieces came from. You don't need to memorize the dates; pay attention to what each step could separate, and what it still shared.

## Start with the filesystem: chroot

Back in 1979, Unix gained a system call called **chroot**, short for "change root." Its job is to change the directory a process treats as `/` when resolving absolute paths.

Suppose we prepare an application filesystem under `/srv/example-root`. After changing the process's root to that directory, `/etc` refers to the `etc` directory inside it rather than the host's usual `/etc`.

That is useful when you want to test software against a different set of files, prepare an operating system installation, or keep a service's ordinary filesystem access within a smaller directory tree. We have started putting the process into a box, at least as far as path lookup is concerned.

Beware, though, **chroot is not a complete isolation or security boundary**. It does not create a separate process list, network stack, or resource budget, and it does not automatically close file descriptors that already refer outside the new root. A sufficiently privileged process can escape it in circumstances that a proper sandbox must prevent.

So we have a different root directory, but not a container yet. The files might look different from inside the box while almost everything else is still shared with the host.

## More than a directory: jails and zones

FreeBSD introduced **jails** in FreeBSD 4.0 in 2000, extending the idea beyond the filesystem. A jailed environment could have its own identity and restrictions on what processes and networking resources it could access, while still sharing the FreeBSD kernel.

That made it practical to run separate services or customer environments on one operating system without giving each one a complete VM. The exact networking and resource-control features evolved over time, so a modern jail is not limited to what the first release supported.

**Solaris Zones**, delivered with Solaris 10 in 2005, addressed a similar need on Solaris. Multiple isolated environments could share the operating system while keeping applications and administration separated.

These are not old Docker implementations, and they are not Linux features. They are separate approaches to **operating-system-level virtualization**, which is the broader idea of isolating environments while sharing a kernel.

In other words, the question was already well established: how much separation can we provide without running a different kernel for each environment?

## Linux builds the pieces

Linux did not gain a single system call called "make me a container." Instead, it developed several mechanisms that can be combined, and the details arrived over multiple kernel releases.

The first piece we need is **namespaces**. They let a process see a particular set of system resources rather than the host's complete view: a process list, mount points, network interfaces, and other resources, depending on the namespace type.

The second piece is **control groups**, usually called **cgroups**. They organize processes for resource accounting and control, so we can measure usage and configure limits instead of letting every workload compete without a defined budget.

Mount namespaces appeared in Linux in 2002; cgroups entered the mainline kernel in 2008. Other namespace types and improvements followed their own timelines, which is why there is no one kernel version that suddenly introduced everything we now associate with containers.

The distinction between these mechanisms is worth keeping:

- **Namespaces** change which resources a process can see and interact with.
- **Cgroups** account for and control its use of resources.

Neither one automatically provides every protection an application needs. Capabilities, syscall filtering, filesystem permissions, and security modules also contribute to the result. The core security module will help you choose those protections. For the kernel mechanisms behind them, the optional [Linux primitives deep dive](../advanced/linux-primitives/README.md) lets you inspect what each boundary actually changes.

## LXC makes the pieces usable

**LXC**, first released in 2008, brought Linux container mechanisms together behind tools for managing isolated environments. Instead of assembling all the kernel settings by hand each time, you could use a project that did that work for you.

LXC is often associated with **system containers**: environments that look more like a complete Linux userspace and may run an init system with multiple services. That is different from the application-container workflow we'll mostly use, where a container is organized around one application service.

Mind that this is a distinction in how we manage the workload, not a rule that containers can only contain one process. A service can create worker processes, and all of them can belong to the same container.

We now had a way to run isolated Linux environments. What was still less convenient was handing an application to someone else and giving them a straightforward, repeatable way to run it.

## Docker makes the workflow the point

Docker was released publicly in 2013. Early versions used LXC to run containers; later, Docker moved to its own libcontainer implementation, which contributed to what became `runc`.

The useful change for developers was bigger than the choice of runtime. Docker brought together an image format, build instructions, registries, and a CLI so you could describe an environment, build it, share it, and create containers from it.

You no longer had to ask a colleague to reconstruct your environment from a collection of notes. You could publish an image and point them at it, and the same workflow could be used by a CI pipeline or a deployment system.

That is why "Docker invented containers" misses the point. The kernel mechanisms and earlier tools were already there; Docker made an application delivery model around them accessible and widely adopted.

It also explains why this course does not stop at learning Docker commands. The workflow is important, but the underlying container does not require the Docker brand.

## Agreeing on the box: OCI

Once multiple tools started building and running images, compatibility became important. We don't want every runtime to need a completely different package for the same application, right?

The **Open Container Initiative**, or **OCI**, was established in 2015 under the Linux Foundation to develop shared specifications. Today, three specifications cover different parts of the workflow:

| Specification | What it standardizes |
|---------------|---------------------|
| Image | The structure of an image: filesystem layers and metadata |
| Runtime | The configuration and lifecycle of a prepared container on a host |
| Distribution | The registry API used to transfer content such as images |

These are contracts, not an operating system or a guarantee that every image runs on every machine. An image still targets a platform, and its application still depends on compatible kernel behavior.

**runc** is a low-level implementation of the OCI runtime specification. **containerd** is a service that manages concerns such as image content and container execution, using a low-level runtime to create the container processes.

Docker Engine uses containerd internally, so using Docker doesn't mean containerd is absent: Docker is managing that part for us. We'll follow those steps in the runtime architecture module. If you want to use containerd directly after that, there will be a separate advanced lab; for now, keep using Docker.

## Recap

So, to sum up: chroot restricted filesystem path lookup; jails and zones offered broader shared-kernel environments; Linux added mechanisms that tools such as LXC could combine. Docker built a widely usable application workflow around containers, and OCI defined contracts that different implementations could share.

The useful distinction is that Docker gives us the workflow, while several Linux mechanisms make the isolation possible. Look back at the launch command: which argument selects the image containing Python, and which part of the running system must still come from the Linux host?

The [next chapter](06-virtual-machines-vs-containers.md) compares that shared-kernel model with a VM's separate-kernel model and helps you decide when to choose each.

## Further reading

- [Linux chroot manual](https://man7.org/linux/man-pages/man2/chroot.2.html)
- [FreeBSD Handbook: jails](https://docs.freebsd.org/en/books/handbook/jails/)
- [LXC project](https://linuxcontainers.org/lxc/introduction/)
- [OCI overview and specifications](https://opencontainers.org/about/overview/)
- [containerd project](https://containerd.io/)
