---
title: "Virtual machines vs containers"
track: architecture
---

# Virtual machines vs containers

You have an application to deploy, and someone asks whether it should run in a virtual machine or a container. After the previous chapters, you might be tempted to answer "a container, because it's lighter."

Slow down a minute. Lighter is useful, but it doesn't tell us which kernel the application needs, who we trust to run code, or what happens when something goes wrong.

In this chapter, we'll compare the two models using those questions. We won't configure the security mechanisms yet; the goal is to make a sensible deployment choice before getting lost in flags.

## Where does the kernel live?

With a VM, the application calls into the **guest kernel**. That kernel manages the guest's processes and memory and accesses virtual devices provided by the virtualization platform.

With a Linux container, the application calls into the **kernel of the Linux host running it**. The runtime configures a restricted environment for its processes, but it does not boot another kernel for them.

This means you can run an Ubuntu userspace in one container and an Alpine userspace in another on the same Linux machine. Their files and libraries differ, but both use the same running kernel.

You cannot use that arrangement to run an ordinary Windows application that requires the Windows kernel on a Linux host. Windows has its own container technologies, including different isolation modes; this course is about Linux containers.

On macOS or Windows, Docker Desktop supplies a Linux environment through virtualization. The Linux containers share that environment's kernel, not the macOS or Windows kernel of your laptop.

## What isolation actually means

The word **isolated** can hide several different promises. Are we trying to avoid dependency conflicts, keep processes from seeing each other, limit memory consumption, or contain actively hostile code?

Those are related goals, but they are not interchangeable. Having a private filesystem does not prove that a process cannot exhaust memory, and hiding another process from a process list does not remove every way the two can affect each other.

A useful starting comparison is:

| Question | Virtual machine | Linux container |
|----------|-----------------|-----------------|
| Which kernel serves the application? | The guest's own kernel | The shared Linux host kernel |
| Where are application dependencies installed? | In the guest filesystem | In the container filesystem, with any configured mounts |
| What enforces separation? | Hypervisor and virtual hardware boundaries, plus guest controls | Host kernel isolation and security mechanisms |
| Are resource limits automatic? | Virtual resources are assigned, with platform-specific enforcement and sharing | Limits must be configured; sharing a kernel does not imply a small CPU or memory quota |
| What does starting normally involve? | Booting or resuming a guest, then starting the application | Preparing isolation and starting the application's processes |
| Can different kernels coexist? | Yes, in separate guests | Not within an ordinary shared-kernel container host |

Notice that neither column says "perfect security." They describe where the boundary is implemented, which tells us what we need to protect and what a failure might affect.

## If something breaks inside

Suppose an application has a vulnerability that lets an attacker execute code. What can that code reach?

In a properly configured VM, compromising the application or even the guest kernel does not automatically grant control over the physical host. The attacker would still need to cross the virtualization boundary, exploit exposed integration features, or abuse some other access.

In a container, the compromised process is already interacting with the same kernel that serves the other containers. Namespaces, restricted privileges, syscall filters, and security policies reduce what it can do, but a vulnerability in reachable host-kernel code may allow it to cross that boundary.

That is why ordinary containers are generally not the first boundary I would choose for running arbitrary code from people I do not trust. VMs provide a stronger starting separation for that threat model, although their hypervisors, device implementations, and management interfaces also need maintenance.

Configuration can weaken either model. A container given broad privileges, sensitive host mounts, or access to the Docker socket may gain control over the host without needing a kernel vulnerability at all.

**Isolation is a property of the whole configuration, not a label attached to the workload.** We'll return to rootless execution, capabilities, seccomp, and sandboxed runtimes in [module 10](../10-security/README.md).

## If something uses all the memory

Security is not the only reason to isolate applications. An ordinary bug can cause a process to allocate memory until other workloads suffer.

VMs have configured virtual resources, although overcommit and shared physical infrastructure still need careful management. With containers, we can use cgroups to define resource budgets, but running a container does not by itself mean we have configured an appropriate limit.

There is another shared failure domain: a host-kernel failure affects all the containers using that kernel. A guest-kernel failure normally stays within its VM, while a physical-host or hypervisor failure can still affect all the guests.

We can improve the separation inside a machine, but availability also needs replication across independent hosts or failure domains. Neither `docker run` nor creating a VM provides that automatically.

## Density and startup, without the magic numbers

Containers avoid a separate guest kernel and a separate OS boot for each application environment. This often lets you fit more workloads on the same hardware and start them with less overhead.

But "containers start instantly" is not a useful performance requirement. Pulling a large image over a slow connection can take longer than booting a cached VM, and an application that spends a minute warming up will still do that inside a container.

The same applies to density. If the application needs most of the machine's memory, packaging it differently will not create more memory, and adding strict security or networking layers can introduce costs of its own.

For a fair comparison, measure the workload you actually care about: image or disk availability, initialization time, steady-state resource usage, and the controls you need. Don't compare the startup of an empty container with a full VM running a collection of unrelated services.

## Different hosts can still mean different behavior

Remember the box from chapter 01? The image contains the application's userspace, not the kernel or the physical CPU.

An application may depend on a syscall or kernel feature that is absent or restricted on another host. A security policy can reject an operation that works elsewhere, and binaries compiled for a particular CPU architecture or instruction set may not work on another machine.

Even when these are compatible, external inputs still matter: environment variables, mounted files, DNS, available memory, and remote services can all change behavior. Containers control an important part of the environment, not every condition under which a program executes.

This is why we should deploy the same image when comparing environments, then inspect what remains outside it. Rebuilding the same Dockerfile on each machine adds another variable before we have even started debugging.

## What I would choose

For an application service with a compatible Linux userspace, containers are usually my starting point for packaging and deployment. They make it straightforward to distribute a prepared environment and replace instances without maintaining a separate guest OS for each service.

If I need a different kernel, a whole operating system with its own administration, or stronger separation between untrusted tenants, I start by considering VMs. Dedicated physical servers can still make sense for particular hardware requirements or workloads where sharing is undesirable.

And very often the answer is **both**. A cloud VM gives you a Linux host and a virtualization boundary; containers inside it give you application packaging and process-level separation. This is not a compromise that defeats the point of containers: it is a common way to use the two technologies for different jobs.

## Recap

VMs separate machines and kernels; containers separate application environments and processes using a shared kernel. That leads to different overheads, compatibility requirements, and failure boundaries, rather than a universal winner.

**Choose the boundary for the workload and the threat model, then choose the workflow for delivering the application.**

## Return to the application

The first exercise let you run two differently configured instances. Before checking the explanations above, answer these questions in your own words:

- If one instance needs a different Python version, do you necessarily need a VM?
- If one instance needs a different Linux kernel, what changes?
- Would you use the same isolation arrangement to run arbitrary programs uploaded by strangers? Which risk changes your answer?

Compare your reasoning with a peer if you can. If you're working alone, write down the boundary you are relying on and one failure it does not contain, then check it against the earlier sections.

You now have a working example and a reason to investigate its internals. In [module 02](../02-linux-primitives/README.md), we'll revisit what the process can see and how the host controls it. The optional [containerd installation](02-installing-docker-and-containerd.md#optional-add-nerdctl-to-the-linux-lab) is available when you are ready for a second runtime path; it is not required to complete this module.
