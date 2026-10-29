---
title: "Inspecting namespaces and cgroups"
track: runbook
---

# Inspecting namespaces and cgroups

Let's collect evidence for the boundaries we've been discussing. We'll create
two quiet processes, compare their views, and read the kernel's resource settings.
No stress test, no privileged container, and no need to enter Desktop's VM.

## Before you start

Use the Bash environment from module 01 and a Linux Docker engine. Prefix Docker
commands with `sudo` if your rootful Engine setup requires it. This lab uses
cgroup v2 for file-level inspection:

```bash
docker info --format 'cgroup version={{.CgroupVersion}} driver={{.CgroupDriver}}'
docker ps -a --filter name=ark-boundary
```

If either `ark-boundary-a` or `ark-boundary-b` already exists, inspect it and
choose another pair of names or clean up your own previous attempt. Don't
overwrite someone else's work. If the engine reports cgroup v1, you can compare
namespaces but need a v2 environment for the resource-file steps.

The examples use the moving `alpine:3.22` tag, available for common amd64 and
arm64 platforms. The image remains downloaded after cleanup. The containers
expire after ten minutes, but still need removal.

## 1. Ask for explicit boundaries

```bash
docker run -d --name ark-boundary-a \
  --hostname ark-a --network none --read-only --user 65534:65534 \
  --cap-drop ALL --security-opt no-new-privileges=true \
  --memory 64m --memory-swap 64m --cpus 0.5 --pids-limit 32 \
  docker.io/library/alpine:3.22 sleep 600
docker run -d --name ark-boundary-b \
  --hostname ark-b --network none --read-only --user 65534:65534 \
  --cap-drop ALL --security-opt no-new-privileges=true \
  --memory 64m --memory-swap 64m --cpus 0.5 --pids-limit 32 \
  docker.io/library/alpine:3.22 sleep 600
```

Read any engine warnings. If resource controls aren't supported, stop here and
record that limitation rather than assuming the settings took effect.
`--network none` still supplies a network namespace with loopback; it does not
give these processes external connectivity.

## 2. Compare views, not just names

Predict which namespace identifiers will match before running:

```bash
for name in ark-boundary-a ark-boundary-b; do
  echo "=== $name ==="
  docker exec "$name" sh -c '
    hostname
    for kind in pid net mnt uts user cgroup; do
      printf "%s: " "$kind"
      readlink "/proc/self/ns/$kind"
    done
    printf "PID 1: "; cat /proc/1/comm
  '
done
```

PID, network, mount and UTS identifiers should differ. User namespace identifiers
may match when the engine doesn't use separate user namespaces for these
containers. Cgroup namespace behavior depends on engine configuration.
Different hostnames alone would not have established the other boundaries.

Now ask a one-off process to share only the first container's network namespace:

```bash
docker run --rm --network container:ark-boundary-a \
  --user 65534:65534 --cap-drop ALL \
  --security-opt no-new-privileges=true \
  --memory 32m --memory-swap 32m --pids-limit 16 \
  docker.io/library/alpine:3.22 sh -c '
    readlink /proc/self/ns/net
    readlink /proc/self/ns/pid
  '
```

Its network identifier should match `ark-boundary-a`; its PID namespace should
not. That is a more precise statement than "the containers share isolation".

## 3. Read the actual resource settings

```bash
docker inspect --format \
  'memory={{.HostConfig.Memory}} swap={{.HostConfig.MemorySwap}} cpu={{.HostConfig.NanoCpus}} pids={{.HostConfig.PidsLimit}}' \
  ark-boundary-a
docker exec ark-boundary-a sh -c '
  cat /proc/self/cgroup
  for setting in memory.max memory.swap.max memory.current memory.events cpu.max cpu.stat pids.max pids.current; do
    printf "\n%s\n" "$setting"
    cat "/sys/fs/cgroup/$setting"
  done
'
```

Expect `memory.max` to be `67108864`, `memory.swap.max` to be `0` where supported,
and `pids.max` to be `32`. In `cpu.max`, divide quota by period: the ratio should
be 0.5. Docker's `NanoCpus` request is `500000000`. The `MemorySwap` engine field
is a memory-plus-swap budget, not the same quantity as `memory.swap.max`.

Usage and counter values vary; don't compare them to invented fixed outputs.
On some configurations, the cgroup filesystem exposes a broader hierarchy
rather than the current group at its root. If the expected files are absent,
inspect `/proc/self/cgroup`, engine namespace settings and the host mount
layout. Don't create or rewrite cgroup files to force this example to match.

## 4. Check the process's authority

```bash
docker exec ark-boundary-a sh -c '
  id
  grep -E "^(CapEff|NoNewPrivs|Seccomp):" /proc/self/status
  if [ -r /proc/self/attr/current ]; then
    cat /proc/self/attr/current
  else
    printf "No readable current LSM label in this environment\n"
  fi
'
```

Expect UID/GID 65534, a zero effective capability mask and `NoNewPrivs: 1`.
On a seccomp-enabled engine, `Seccomp: 2` indicates filter mode. Record the LSM
label actually shown rather than expecting AppArmor on every distribution.
If a readable policy file returns an error, investigate that error; don't
interpret it as "no policy".

## 5. Optional: compare with the engine host

Only do this on a **native Linux host or VM running this Docker engine**.
A Desktop client's WSL distribution is not that host.

```bash
pid=$(docker inspect --format '{{.State.Pid}}' ark-boundary-a)
printf 'Engine-host PID: %s\n' "$pid"
sudo lsns --task "$pid"
sudo readlink "/proc/$pid/ns/pid"
sudo cat "/proc/$pid/cgroup"
```

The host sees the process under its host PID and can describe its namespaces.
Compare the PID namespace identifier to the container-side result. With suitable
permissions on a rootful native engine, this read-only namespace entry also
retrieves the configured hostname:

```bash
sudo nsenter --target "$pid" --uts hostname
```

Joining UTS alone doesn't put your shell inside the target filesystem or PID
view. We aren't starting an interactive host-root shell in the container.

## Clean up and explain

```bash
docker stop ark-boundary-a ark-boundary-b
docker rm ark-boundary-a ark-boundary-b
```

If the sleeps expired, skip `stop` for those already stopped and remove them.
There are no persistent volumes or custom networks to delete.

Return to the first service's launch command. Which of its properties were
namespace views, which were filesystem choices, and which explicit limits
were missing? Then try the [boundary kata](katas/README.md) without copying
this lab's explanation.
