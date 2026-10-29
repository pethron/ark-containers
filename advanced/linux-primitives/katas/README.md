# What does this boundary actually protect?

Your team sees two services listening on port 8000 and concludes they must
have separate kernels and guaranteed memory budgets. You have a working setup,
but the explanation is wrong. Collect enough evidence to correct it.

## 1. Review the two services

Complete the [inspection lab](../06-inspecting-namespaces-and-cgroups.md) first.
Then use two fresh names, `ark-review-a` and `ark-review-b`, for two Alpine
sleep processes. Keep the same safe settings and finite lifetime, but choose
a different memory ceiling between 32 and 96 MiB for each.

Before launching, write a prediction for each:

- PID and network namespace identity compared with the other process;
- the kernel release returned by `uname -r`;
- `memory.max` in bytes;
- whether the source image contains that kernel.

Collect the observations and explain any mismatch. Show that different resource
budgets don't imply different kernels, and that matching kernel release strings
alone wouldn't prove two remote machines share one kernel.

<details>
<summary>Where should I look?</summary>

Use `/proc/self/ns`, `/sys/fs/cgroup`, `uname` and Docker inspection together.
One hostname string is not evidence for every kind of isolation. On Desktop,
remember which host the engine-side PID belongs to.

</details>

Stop and remove only the two review containers. The image remains; no data
volumes or host configuration changes are involved.

## 2. Optional Linux VM experiment: assemble a small sandbox

Now try a different question: can you assemble a recognizable subset of those
boundaries without running Docker? The supplied [script](manual-sandbox.sh)
creates a namespace-local, memory-backed root filesystem containing BusyBox,
starts a shell with separate PID, mount, UTS, IPC and network namespaces, and
places the work in a bounded systemd scope.

**Use a disposable Ubuntu 24.04 or newer VM with systemd, not Docker Desktop's
internal VM, a production server, or a privileged container.** The script needs
root, `unshare`, `systemd-run`, `file` and a statically linked BusyBox. On a
fresh Ubuntu VM, install the small prerequisites:

```bash
sudo apt-get update
sudo apt-get install -y busybox-static util-linux file
```

Run from this directory in the VM:

```bash
sudo bash manual-sandbox.sh
```

This is **not a hardened container runtime**. The shell still runs as host root,
does not create a user namespace, drop capabilities, apply seccomp or configure
an LSM profile. Run only the supplied observations, not untrusted code. The new
network namespace has no configured external connectivity.

Inside the shell, investigate:

```bash
echo "PID=$$"
hostname
uname -r
ls /
cat /proc/self/cgroup
readlink /proc/self/ns/pid
ls /proc
exit
```

Expect the shell to be PID 1, hostname `ark-manual`, and a small root filesystem.
The kernel release still comes from the VM. Explain why `/proc` had to be
mounted after entering the new PID namespace.

The script prints the transient scope name before entry. To read its configured
resource limits from a second VM terminal while the shell is open, substitute
that exact name:

```bash
sudo systemctl show ark-manual-REPLACE.scope -p MemoryMax -p MemorySwapMax -p TasksMax
```

Expect 64 MiB, zero swap and 32 tasks. If systemd or the kernel rejects a limit
or namespace operation, keep the error and investigate the VM prerequisites.
Don't remove a protection or silently continue with fewer boundaries.

Exit the shell to end the scope. Its namespace-local mounts disappear and the
script removes its now-empty temporary mountpoint. If interrupted before the
final message, inspect only the exact temporary path and scope printed by that
run; don't recursively delete a guessed directory or stop unrelated scopes.

## Bring it back to the application

Write a short explanation for the team: which pieces of this experiment did
Docker previously arrange, and which important runtime work did we leave out?
Include at least credentials, security policy, image handling and lifecycle
management.

Discuss it with a colleague, or reread it the next day before reopening the
chapters. The goal isn't to replace Docker with a shell script. It's to stop
treating the box as a different kind of computer.
