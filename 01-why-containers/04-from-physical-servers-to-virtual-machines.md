---
title: "From physical servers to virtual machines"
track: architecture
---

# From physical servers to virtual machines

You've now run an application without installing its runtime on your machine, changed its configuration, and fixed a connection problem. Let's take a step back: how would we have delivered that application before containers became part of the workflow?

Suppose you need to deploy a second application, but the server already runs the first one. They need different versions of the same library, both expect to listen on port 80, and neither team wants the other team updating the operating system. Do you buy another server?

For a long time, that was a perfectly reasonable answer. In this chapter, we'll see why it became expensive, what virtual machines changed, and which problems were still there when containers became popular.

Beware, though, this is not a story where every new technology makes the previous one useless. Physical servers, virtual machines, and containers are all still around, often running your application together.

## One application, one server

So, first of all, let's define a **physical server**. It's a computer with actual processors, memory, disks, and network interfaces, on which you install an operating system and run your software. When that operating system runs directly on the hardware rather than inside a virtual machine, we call it a **bare-metal** installation.

You can run more than one application on it, of course. Operating systems have been managing multiple processes for much longer than Docker has existed, and separate users, permissions, and service configurations already give us useful controls.

The problem is that those applications still share a lot of operational decisions. Updating a system library might affect several services, a configuration mistake might expose someone else's files, and a process using all the available memory can make the whole machine miserable. You can address these problems, but every additional service makes the arrangement harder to manage.

Giving each important application its own server made the responsibilities clearer. One team could choose the operating system, install its dependencies, and schedule maintenance without coordinating with everyone else. If that machine failed, applications on other servers were not directly affected.

And now for the downsides. You had to purchase the hardware, find space for it, power it, and wait for someone to install it, even if your application only needed a small part of its capacity.

## Capacity you paid for but don't use

Imagine three applications, each installed on a separate server. Most of the day, each application uses only a fraction of the available CPU, but you cannot simply move the unused capacity from one physical machine to another.

You also need room for traffic spikes. Buying hardware only for the average load would make the application struggle at the busiest time, so you buy more than you usually need and spend most of the day not using it.

This is not necessarily a mistake. Dedicated hardware can be the right choice for demanding workloads, particular devices, or strict operational requirements. But for a collection of ordinary business applications, one server per application can become an expensive way to avoid conflicts.

What we would like is to keep the separate environments without needing a separate physical computer for each one. That's where virtual machines become useful.

## A machine that isn't physical

Let's give the next piece a definition:

> **A virtual machine is a software-defined computer with virtual hardware, on which a guest operating system runs its own kernel.**

The important words are **virtual hardware** and **guest operating system**. Instead of giving an application an entire physical server, we give it a machine with virtual CPUs, memory, disks, and network interfaces.

A component called the **hypervisor** manages those machines and their access to the real hardware. Each guest boots its own operating system, which manages the processes running inside it. The guest does not need to be the same operating system as the other guests.

Mind that virtual hardware does not mean every CPU instruction is simulated in software. On compatible processors, hardware-assisted virtualization lets much of the guest's code execute directly on the CPU, while the virtualization layer maintains control over privileged operations and memory access. Emulation, which can also reproduce a different CPU architecture, is a different mechanism with different costs.

You will also hear about **type 1** hypervisors, which run directly on the hardware, and **type 2** hypervisors, which run on top of a host operating system. These are useful categories, but some implementations don't fit neatly into a little drawing: KVM, for example, makes the Linux kernel part of the virtualization infrastructure.

For now, the detail worth remembering is that the guest has its own kernel. That's the difference we'll come back to when we compare VMs with containers.

## More applications on the same hardware

With virtualization, our three applications can live in three VMs on one physical server. Each VM has its own operating system and dependencies, so changing a library in one guest does not replace the library in another.

We can assign CPU and memory resources to each VM and control how they compete for the physical machine. We can also create a new VM from an image instead of waiting for another server to arrive.

This made **server consolidation** practical: putting workloads that previously occupied separate servers onto fewer, better-used machines. It also made it easier to automate provisioning, duplicate test environments, and move workloads between compatible hosts.

Beware, though, three VMs on the same server are not three independent physical failure domains. If the underlying server fails, all three can go down together. Virtualization separates execution environments; availability still requires a design that accounts for shared infrastructure.

## What the cloud changed

Public clouds made this model available through an API. Instead of purchasing a server, you can request a VM with a particular amount of CPU and memory, boot an image, and release the instance when you no longer need it.

Virtualization did not begin with the cloud, or even with modern x86 servers. Mainframe systems were already using virtual machines decades earlier. What changed was how broadly accessible and programmable this capacity became.

Provisioning became faster, but maintaining the guest operating system was still your job when using an ordinary infrastructure-as-a-service VM. Someone still needed to patch it, configure it, and decide what belonged in its image.

## So, why wasn't that enough?

A VM can package an application and its environment, and VM images can absolutely be versioned and deployed consistently. Containers did not invent the idea of shipping a prepared environment.

The difference is the unit we are packaging. With a VM, we also bring a guest kernel and the rest of the operating system needed to manage that machine, even if the application itself is a small web service.

That means memory used by each guest OS, operating systems to patch, and a machine boot sequence before the application starts. The actual cost depends on the guest and the platform: a minimal VM can start quickly, and an application inside a container can still take a long time to initialize.

There is also a workflow problem. If developers still install dependencies manually in each VM, environment drift has not gone anywhere; we have just moved it into virtual machines. Templates, configuration management, and automated image builds help, but virtualization alone does not impose a repeatable application delivery process.

So the next question becomes: if several applications need a compatible Linux kernel, could we keep their environments separate without booting that kernel again for every application? That is the part of the problem containers address.

## Recap

We started with physical servers, separated applications to avoid conflicts, and found ourselves paying for capacity we weren't using. Virtual machines let us share the hardware while keeping separate operating systems, and cloud APIs made provisioning those machines much easier.

**Containers change the unit of isolation from a whole machine to a set of processes sharing a kernel.** That does not make VMs obsolete: a very common deployment is a physical server running VMs, with containers inside those VMs.

Before moving on, consider the two differently configured instances you ran in the first exercise. What did that separate, and what would putting each instance on its own physical server separate as well? Keep the difference between application configuration and shared infrastructure in mind.

In the [next chapter](05-a-short-history-of-isolation-chroot-to-oci.md), we'll follow the other part of the story: how operating systems learned to give processes separate views of the same machine, and how Docker made that useful to a much wider audience.
