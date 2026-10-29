---
title: "Capabilities, seccomp and LSMs"
track: architecture
---

# Capabilities, seccomp and LSMs

We ran the service as user `65534:65534`. Does that make it safe? It's a useful
choice, but a single UID cannot describe every permission available to a Linux
process. There are several checks between "the program asked" and "the kernel
allowed it".

Let's follow those checks without turning this into the full hardening module.
You should leave able to distinguish credentials, capabilities, syscall filters
and security labels, and know which evidence to collect when a request fails.

## Start with ordinary permissions

A process has user and group credentials. The kernel uses them, along with file
mode bits and possibly ACLs, when checking access to a file. Inside our Python
container, numeric UID 65534 can read the supplied file because its permissions
allow reading; a friendly username isn't necessary.

User namespaces can map a UID inside a container to a different host UID.
Without that remapping, container UID 0 is host UID 0, though namespaces,
capability restrictions and other policy still constrain it. "Root in a
container" is therefore neither always identical to unrestricted host root nor
automatically harmless.

Bind mounts make the distinction practical. Mounting a host directory writable
exposes its files to permission checks involving the container process's mapped
credentials. Changing a username in `/etc/passwd` doesn't fix the numeric
ownership relationship.

## Capabilities split up privileged operations

Linux divides many traditionally root-only operations into **capabilities**.
For example, `CAP_NET_ADMIN` covers network administration, while `CAP_CHOWN`
allows certain ownership changes. `CAP_SYS_ADMIN` covers a particularly broad
set of operations; it isn't a convenient generic "make it work" permission.

Capabilities belong to process credential sets, not just a container-wide
boolean. Effective, permitted, inheritable, bounding and ambient sets have
different roles in checking and propagating authority. The `CapEff` line in
`/proc/self/status` is a hexadecimal mask for the effective set.

The scope also matters. Some checks concern resources governed by a user
namespace; others need authority in the initial user namespace. Rootless
container root does not simply acquire every host-level capability.

Docker normally starts containers with a reduced capability set. Starting as
a non-root user and dropping all capabilities are distinct choices; don't
infer the exact result from a UID alone. The inspection lab reads the process
status and compares it with requested settings.

## Seccomp filters system calls

A process asks the kernel to perform operations through **system calls**.
Seccomp can filter those calls, optionally inspecting their arguments. A filter
can reject a call with an error or take other configured actions; it doesn't
decide which paths a process may read in the general case.

Docker normally applies a default seccomp profile on supported Linux systems.
This reduces the available kernel interface, but doesn't mean allowed calls
are universally safe. A vulnerability reachable through an allowed syscall is
still a vulnerability.

`Seccomp: 2` in `/proc/self/status` means filter mode is active. It does not tell
you the filter's full content or prove it is Docker's unmodified default.
On some environments, an outer layer already applies a filter.

## AppArmor and SELinux add another policy layer

Linux Security Modules provide hooks for additional access-control policies.
AppArmor commonly uses profiles involving executable and path-based rules;
SELinux uses labels and policy rules describing allowed interactions.
Distribution and host configuration determine which protections are active.

That means a request can pass file mode checks and still be denied by mandatory
policy. Read the actual engine settings and host audit evidence. On SELinux
hosts, don't relabel arbitrary system directories just to make a bind mount
work; understand the label and the intended sharing first.

The lab's `/proc/self/attr/current` check is read-only. Depending on the active
LSM, it may show a profile or label, or be unavailable. Absence of one expected
string does not prove that the entire host has no security policy.

## Prevent gaining privileges later

`--security-opt no-new-privileges=true` asks Docker to set Linux's
`no_new_privs` flag for the process. It prevents privilege gains across
`execve`, such as through a set-user-ID executable. It is inherited and isn't
something the application can simply unset again.

This doesn't remove privileges already held, replace a seccomp filter or turn
a writable host mount into a read-only one. It is another constraint, useful
alongside the others.

## An error is a clue, not a reason to disable everything

If a program receives `Permission denied` or `Operation not permitted`, first
identify the operation and gather evidence. Check numeric credentials, file
permissions, mount flags, capabilities and relevant policy logs. A missing
file or read-only filesystem is not repaired by adding network capabilities.

Avoid the diagnostic ritual of adding `--privileged`, disabling seccomp and
mounting the Docker socket. That changes several boundaries at once and may
give the process control of the engine host. It also destroys the evidence of
which permission was actually missing.

Before continuing, match each requirement to a mechanism: read a source file,
change a network interface, reject an unwanted syscall, constrain a process
with an AppArmor profile. Which of them would a memory limit solve?

## Same image, a different host result

Here's an illustrative compatibility trace, not output you need to reproduce
by installing an old kernel or weakening your host:

```text
Host A: clone3(...) = -1 ENOSYS
        userspace falls back to another supported process-creation path
Host B: clone3(...) = -1 EPERM
        userspace treats the failure as a denied operation
```

Different library versions have different fallback behavior, but the
distinction matters: "this syscall isn't implemented" and "this operation is
forbidden" aren't necessarily handled the same way. A seccomp policy can
change the observed error even when the image bytes are identical.

If a new image works on one host and fails before application startup on
another, compare kernel, engine and policy versions as well as the image
reference. Prefer a supported host/policy update or a compatible application
build over disabling the entire filter. Explain which evidence would separate
a missing kernel feature from a denied call before proposing a fix.

Next, [root filesystems](05-root-filesystems-chroot-and-pivot-root.md) explain
where the paths in those permission checks come from.

## Further reading

- [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html)
- [Docker seccomp](https://docs.docker.com/engine/security/seccomp/)
- [Docker AppArmor](https://docs.docker.com/engine/security/apparmor/)
- [no_new_privs](https://www.kernel.org/doc/html/latest/userspace-api/no_new_privs.html)
