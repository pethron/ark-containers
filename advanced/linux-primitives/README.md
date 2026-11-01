# Linux primitives

**Optional advanced deep dive, not required to complete the core course.**

The first service worked, and it seemed to have an environment of its own.
Let's find out what that really meant: a process with different views of the
system, a prepared filesystem and a chosen set of permissions, still asking
the host kernel to do the work.

We'll look at the namespaces that change what a process can see (pid, net,
mnt, uts, ipc, user and cgroup), the cgroups v2 controllers that account for
its CPU, memory, I/O and process count, and the capabilities, seccomp filters
and security modules such as AppArmor and SELinux that restrict what it may
do. The root filesystem completes the picture, from chroot to pivot_root.

The most useful way in is through the inspection lab, the last chapter in
this section. Run its first two steps, keep the observations nearby while
reading the explanations, then return to its resource and permission checks
with a better idea of what you're measuring. The lab works with Linux
containers on Docker Desktop or native Engine. The manual sandbox kata needs a
disposable Linux VM with systemd and root access, and it states its
prerequisites and the protections it deliberately leaves out.

By the end, try explaining why two services can share one kernel but have
different port spaces, and why that says nothing about a memory budget. Use
what you observed in the lab, not just the definitions.
