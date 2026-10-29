---
title: "Root filesystems, chroot and pivot_root"
track: architecture
---

# Root filesystems, chroot and pivot_root

Inside the first container, `/app/app.py` existed even though your checkout
was somewhere completely different on the laptop. Python's standard library
was there too, without being installed on your host. How did those paths end
up in the same filesystem view?

The runtime assembled that view before starting Python. Some content came from
the image, some from mounts, and some from kernel-provided virtual filesystems.
Let's follow those pieces without assuming that a different `/` is a security
boundary all by itself.

## A root filesystem is userspace content

A process resolves an absolute path starting at its root directory. A container
runtime prepares a filesystem tree and makes it the application's root. That
tree includes executables, libraries and configuration from the image, plus
runtime additions such as `/proc`, device entries and configured mounts.

An image is not necessarily a bootable operating system. It can contain a
distribution's userspace without an init system or kernel. A tiny application
image may contain only one executable and the files it needs.

This also explains a confusing error: an executable can exist and still fail
with "not found" because the dynamic linker named in the executable is missing.
Copying a dynamically linked binary into an empty directory doesn't copy its
runtime dependencies. Our manual sandbox uses a **statically linked BusyBox**
to avoid making dynamic-linker setup the point of the exercise.

## What chroot changes

`chroot` changes a process's root directory for path resolution. Once inside,
`/bin/sh` means the file under the new root, not automatically the host's shell.
It doesn't create PID or network namespaces, impose resource limits, or remove
capabilities.

That's why chroot alone isn't a safe way to contain an untrusted program.
Privileges, inherited file descriptors and access to paths outside the intended
tree can undermine the boundary. The manual exercise demonstrates a filesystem
view; it is not a production sandbox.

The process's working directory matters too. A root change doesn't excuse
leaving it pointing outside the new tree. Runtime setup must arrange the
working directory and close or constrain inherited resources deliberately.

## Why runtimes also use pivot_root

`pivot_root` changes the root mount in a mount namespace. Roughly speaking, it
moves the previous root to a chosen location under the new root, so setup code
can detach it after switching directories. The syscall has mount-layout and
privilege requirements; it isn't just `chroot` with another spelling.

With a suitable private mount namespace, a runtime can build the mount tree,
switch roots, detach the old root and then apply the remaining credentials and
security policy. The exact implementation may use `pivot_root` or another
supported root-switching path depending on the runtime and configuration.
Don't assume every container was created by one fixed syscall sequence.

We won't pivot your host root in a course command. The manual lab confines mount
changes to a new namespace and uses chroot to keep the example readable.

## Mounts fill in what the image doesn't contain

Our first command mounted a host file over `/app/app.py`. The image's root
filesystem supplied Python, but the mount supplied the application code.
Removing the container didn't delete the host file because those lifetimes
were separate.

Likewise, `/proc` exposes kernel information rather than ordinary image files.
A procfs mounted for the intended PID namespace lets tools observe that process
view. Reusing an inappropriate procfs mount can expose a different view, even
if a PID namespace exists.

Files such as hostname and resolver configuration may also be supplied by the
engine. Running `ls /` doesn't tell you which content came from image layers,
which was generated, and which is mounted from elsewhere. Use mount information
and engine inspection to answer that.

## A writable layer isn't a durable-data plan

Docker usually gives a container a writable filesystem layer above its image
content. Changes there belong to that container; removing it normally removes
that layer. Volumes and bind mounts have their own lifetimes and can survive.

The implementation depends on the selected storage backend and snapshotter.
OverlayFS is common, not a property required by the definition of a container.
Image layers, unpacked snapshots and runtime mounts are related but different
objects; the image module will follow them more closely.

For now, predict what would survive removing the first service: an edit to the
bind-mounted source made on the host, a file written to the container's writable
layer, and the downloaded Python image. Explain each answer using ownership and
lifetime, not the path's appearance inside `/`.

Next, [inspect the actual boundaries](06-inspecting-namespaces-and-cgroups.md).
Then the optional manual sandbox lets you assemble a few of them yourself.

## Further reading

- [chroot(2)](https://man7.org/linux/man-pages/man2/chroot.2.html)
- [pivot_root(2)](https://man7.org/linux/man-pages/man2/pivot_root.2.html)
- [Docker bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
