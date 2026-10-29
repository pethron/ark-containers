---
title: "docker, nerdctl and ctr side by side"
track: runbook
---

# docker, nerdctl and ctr side by side

This chapter is an optional advanced lab. The main course uses Docker; this
comparison is for readers who want to work with containerd directly after
studying the runtime architecture.

We'll run the known message service without Docker, then use ctr to distinguish
its container record from its running task. We won't attach another client to
Docker's private runtime or install a second engine over a working setup.

## A separate VM, a separate owner

Use a disposable Ubuntu Linux VM, amd64 or arm64, **without Docker or Kubernetes**.
You need root access, Bash, the course files, a standalone containerd daemon,
runc, and nerdctl. Don't reuse Desktop's VM or a node with managed workloads.

On a fresh Ubuntu 24.04 or newer VM, the distribution can supply the daemon
and low-level runtime:

```bash
sudo apt-get update
sudo apt-get install -y containerd runc
sudo systemctl enable --now containerd
```

Install the matching-architecture minimal nerdctl release using the project's
[binary installation instructions](https://github.com/containerd/nerdctl#install).
Use an official tagged release, verify its published SHA-256 checksum, and
record the version. Don't overlay a `nerdctl-full` archive onto the
distribution-managed daemon: this lab already has containerd and runc.

We deliberately use `--net none`, so this experiment needs neither CNI plugins
nor host port publishing. We aren't building images, so BuildKit isn't needed.
Networking and build integration would be additional setup, not hidden Docker
features supplied by command compatibility.

Check the explicit standalone endpoint before creating anything:

```bash
sudo ctr --address /run/containerd/containerd.sock version
sudo nerdctl --address /run/containerd/containerd.sock version
sudo nerdctl --address /run/containerd/containerd.sock info
sudo ctr --address /run/containerd/containerd.sock namespaces list
```

If the daemon is unavailable, the client/server versions are incompatible, or
the resource controller setup is unsupported, fix this VM's prerequisites first.
Don't change the socket to `/var/run/docker/containerd/...` or use Kubernetes'
namespace as an alternative.

## Create one lab namespace

Use `ark-client-lab` only if it doesn't already exist:

```bash
sudo ctr --address /run/containerd/containerd.sock namespaces create ark-client-lab
```

An existing namespace is a reason to inspect or choose another name, not to
delete everything in it. All remaining commands explicitly select this socket
and namespace; default settings are easy to forget.

From the course checkout root:

```bash
cd 01-why-containers/first-app
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-client-lab \
  run -d --name ark-direct-message --net none \
  --user 65534:65534 --cap-drop ALL \
  --security-opt no-new-privileges=true \
  --memory 64m --memory-swap 64m --pids-limit 32 \
  --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
  -e MESSAGE="Direct containerd" \
  docker.io/library/python:3.12-alpine python -u /app/app.py
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-client-lab \
  logs ark-direct-message
```

Wait for the listening message. There is intentionally no host URL: with no
published port and no external network, test the HTTP contract from a process
in the container:

```bash
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-client-lab \
  exec ark-direct-message python -c \
  'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8000/", timeout=5).read().decode()); print(urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=5).read().decode())'
```

Expect the configured message and `{"status": "ok"}`. This checks the same
application, but not Docker's loopback publishing behavior. If startup fails,
read the error and logs; don't add host networking or privileges to bypass it.

## Ask ctr about the lower-level objects

```bash
sudo ctr --address /run/containerd/containerd.sock --namespace ark-client-lab images list
sudo ctr --address /run/containerd/containerd.sock --namespace ark-client-lab containers list
sudo ctr --address /run/containerd/containerd.sock --namespace ark-client-lab tasks list
```

Find the Python image reference, the container record and its live task.
Containerd IDs need not be identical to nerdctl's friendly name. Read the actual
IDs before attempting to correlate records.

Keep ctr read-only for this nerdctl-managed workload. Although both clients use
containerd, nerdctl maintains its own higher-level state and conventions. Ctr
isn't a way to bypass that owner safely.

## Stop execution, then remove metadata

```bash
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-client-lab \
  stop ark-direct-message
sudo ctr --address /run/containerd/containerd.sock --namespace ark-client-lab tasks list
sudo ctr --address /run/containerd/containerd.sock --namespace ark-client-lab containers list
```

The application no longer runs; the container metadata remains. Depending on
client cleanup behavior, an exited task may already be deleted. Describe the
observed lifecycle rather than demanding one particular intermediate task row.

```bash
sudo nerdctl --address /run/containerd/containerd.sock --namespace ark-client-lab \
  rm ark-direct-message
sudo ctr --address /run/containerd/containerd.sock --namespace ark-client-lab containers list
sudo ctr --address /run/containerd/containerd.sock --namespace ark-client-lab tasks list
```

Both lab object lists should now be empty. Image content stays cached in this
disposable VM. We created no persistent application volume or custom CNI
network; there is no reason to prune other namespaces or stop unrelated
services. Dispose of the dedicated VM when finished, or leave its isolated
namespace and image cache for another attempt.

## What did the comparison show?

Compare this result with the Docker lab: same application source and runtime
image reference, different manager, endpoint and object model. A moving tag
doesn't guarantee identical bytes across dates; record digests if exact content
identity is important.

Explain why the absence of this service in `docker ps` would not mean it stopped.
Then explain why `--namespace ark-client-lab` didn't itself supply its Linux
network isolation. If those answers are clear, you've learned more than a
second spelling of `run`.
