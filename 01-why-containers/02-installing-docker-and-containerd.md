---
title: "Installing Docker and containerd"
track: runbook
---

# Installing Docker and containerd

Set up one working Docker environment, then move straight to the application exercise. You do not need to install every tool in this chapter before starting. All course commands use **Bash** unless a different shell is explicitly named.

## Choose your environment

| Environment | Recommended setup | What you can do |
|-------------|-------------------|-----------------|
| Windows or macOS, quickest start | Docker Desktop in Linux-container mode | Follow the Docker exercises |
| Linux, or a Linux VM on any laptop | Docker Engine | Follow the first application exercise and the kernel labs |

**Start with the Docker environment that is easiest to use on your machine.** Docker Desktop is enough for the first experience; nerdctl is an optional extension, not a second installation hurdle.

For the later host-kernel labs, I recommend a dedicated Ubuntu 24.04 LTS VM, using an amd64 or arm64 image matching your hardware. Two virtual CPUs, 4 GB of RAM, and 20 GB of available disk space are a starting allocation, not a requirement for every later workload. If you already have access to a suitable Linux lab, you do not need another machine.

The Linux installation below targets a **fresh Ubuntu 24.04 system with systemd**. Use a disposable lab machine, not a production server or a Kubernetes node: installing runtime packages changes the host.

## Option 1: Docker Desktop

1. Follow the official installer for [Windows](https://docs.docker.com/desktop/setup/install/windows-install/) or [macOS](https://docs.docker.com/desktop/setup/install/mac-install/), choosing the build for your CPU architecture.
2. Start Docker Desktop and wait for its engine to be ready. On Windows, use Linux containers.
3. On Windows, enable the WSL 2 backend and integration with your chosen Linux distribution, then open its Bash shell. On macOS, open a terminal and use Bash for the course examples.
4. Run:

   ```bash
   docker version
   docker info --format '{{.OSType}}'
   ```

`docker version` must show **both Client and Server** information. The second command must print `linux`; a client version alone does not prove that the engine is running.

Do not install Docker Engine inside the same WSL distribution just to repeat this setup. Docker Desktop supplies the engine, and its WSL integration supplies access to it. Check the current [Docker Desktop subscription terms](https://docs.docker.com/subscription/desktop-license/) before using it in an organization.

If these checks pass, continue to [your first application](03-your-first-application.md). Skip the rest of the installation chapter for now. For later host-kernel experiments or direct containerd work, use the separate Linux lab below; we won't modify Docker Desktop's internal VM.

## Option 2: Docker Engine on Ubuntu

### 1. Check the host

Run these commands **inside the Linux lab**, not in a Windows PowerShell prompt or on the macOS host:

```bash
cat /etc/os-release
dpkg --print-architecture
uname -r
ps -p 1 -o comm=
```

Check for Ubuntu `24.04`, architecture `amd64` or `arm64`, and `systemd` as PID 1. You also need `sudo` access and outbound HTTPS access to the package repositories, GitHub releases, and Docker Hub.

If the machine already has Docker, containerd, or runc packages, stop and check the [official package-conflict guidance](https://docs.docker.com/engine/install/ubuntu/#uninstall-old-versions). Do not remove an existing runtime without knowing which workloads use it.

### 2. Add the package repository

The following block runs in a subshell and stops on a failed command. It adds Docker's package-signing key and an apt source specifically for Ubuntu 24.04 (`noble`).

```bash
(
  set -euo pipefail
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl
  sudo install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
  sudo chmod 0644 /etc/apt/keyrings/docker.asc

  printf '%s\n' \
    'Types: deb' \
    'URIs: https://download.docker.com/linux/ubuntu' \
    'Suites: noble' \
    'Components: stable' \
    "Architectures: $(dpkg --print-architecture)" \
    'Signed-By: /etc/apt/keyrings/docker.asc' \
    | sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null

  sudo apt-get update
)
```

Do not continue if a download, signature check, or repository update fails. In particular, do not disable certificate or package-signature verification to get past a proxy problem.

### 3. Install and start the services

```bash
sudo apt-get install -y \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now containerd docker
sudo systemctl is-active containerd docker
```

The last command should report `active` for both services. The `containerd.io` package supplies containerd and runc; do not install Ubuntu's separate `containerd` or `runc` packages alongside it.

We install the current stable packages from Docker's repository rather than freezing the host to an old release. Record the installed versions when comparing results across machines:

```bash
sudo docker version
containerd --version
runc --version
sudo docker compose version
```

### 4. Keep privileged access explicit

The Linux lab examples use `sudo docker` and `sudo nerdctl`. Docker Desktop examples use `docker` without `sudo`.

Access to a rootful Docker daemon or containerd socket is effectively administrative access to the host. Membership in the `docker` group avoids typing `sudo`, but does not make that access unprivileged; we won't do it as an installation shortcut.

Do not make the sockets world-writable or expose an unauthenticated daemon on a TCP port. Rootless operation is a separate setup covered in [module 10](../10-security/README.md).

## Check the first setup, then continue

In your chosen Docker environment, run a small installation check:

```bash
docker run --rm docker.io/library/hello-world:latest
```

In the rootful Linux lab, use `sudo docker run --rm` instead. A successful confirmation and exit mean the engine can download an image and run its program; this is a smoke test, not the application we will use for learning.

You also need the course files. If you have not downloaded them yet:

```bash
git clone https://github.com/pethron/ark-containers.git
cd ark-containers
```

Alternatively, download and extract the course repository's ZIP archive from GitHub, then open a terminal in the extracted folder. You do not need Python, a Python package manager, a registry account, or knowledge of Compose syntax to begin.

Now open [your first application](03-your-first-application.md). Return below only when you want to explore containerd directly.

## Optional: add nerdctl to the Linux lab

<details>
<summary>Second runtime path: install nerdctl and CNI plugins</summary>

Docker Engine already uses containerd. Here we add a client that talks to the system containerd service **without going through the Docker API**.

| Component | Purpose in this setup |
|-----------|-----------------------|
| `docker` | Client for Docker Engine |
| `containerd` | Service managing images and container execution |
| `ctr` | Low-level containerd client, included in `containerd.io` |
| `nerdctl` | Docker-like CLI for containerd |
| CNI plugins | Network setup for containers launched with nerdctl |

The commands below pin nerdctl to `2.4.1` and CNI plugins to `1.9.1`. Check their release notes when updating these versions; do not replace them with a moving `latest` download.

We use the **minimal nerdctl archive** because containerd and runc are already installed. Extracting a `nerdctl-full` bundle over this installation would introduce another set of runtime binaries.

### 1. Install the CLI and network plugins

Run this whole block in Bash on the fresh Linux lab. It downloads release archives into a temporary directory, checks them against upstream SHA-256 files, and installs only nerdctl and the CNI plugins.

```bash
(
  set -euo pipefail
  arch="$(dpkg --print-architecture)"
  case "$arch" in
    amd64|arm64) ;;
    *) printf 'Unsupported lab architecture: %s\n' "$arch" >&2; exit 1 ;;
  esac

  workdir="$(mktemp -d)"
  trap 'rm -rf -- "$workdir"' EXIT
  cd "$workdir"

  nerdctl_version=2.4.1
  nerdctl_archive="nerdctl-${nerdctl_version}-linux-${arch}.tar.gz"
  nerdctl_url="https://github.com/containerd/nerdctl/releases/download/v${nerdctl_version}"
  curl -fLO "${nerdctl_url}/${nerdctl_archive}"
  curl -fLO "${nerdctl_url}/SHA256SUMS"
  grep " ${nerdctl_archive}$" SHA256SUMS > nerdctl.sha256
  sha256sum --check nerdctl.sha256
  tar -xzf "$nerdctl_archive" nerdctl
  sudo install -m 0755 nerdctl /usr/local/bin/nerdctl

  cni_version=1.9.1
  cni_archive="cni-plugins-linux-${arch}-v${cni_version}.tgz"
  cni_url="https://github.com/containernetworking/plugins/releases/download/v${cni_version}"
  curl -fLO "${cni_url}/${cni_archive}"
  curl -fLO "${cni_url}/${cni_archive}.sha256"
  sha256sum --check "${cni_archive}.sha256"
  sudo install -d -m 0755 /opt/cni/bin
  sudo tar -xzf "$cni_archive" -C /opt/cni/bin
)
```

Each checksum check must report `OK`. This detects an archive that does not match the published checksum; it is not an independent verification of the publisher's identity, because both files come from the same release location.

The CNI archive installs networking binaries under `/opt/cni/bin`. nerdctl creates its default bridge-network configuration when needed; Docker's own network setup is separate. BuildKit for `nerdctl build` is not installed here because we are only running existing images; we'll add it when we reach image building.

### 2. Check the service connection

```bash
sudo ctr --address /run/containerd/containerd.sock version
sudo nerdctl --address /run/containerd/containerd.sock version
sudo nerdctl --address /run/containerd/containerd.sock \
  --namespace ark-lab info
```

Both version commands must include server information. We explicitly select the socket so the examples do not depend on a client configuration pointing somewhere else.

We'll keep direct-containerd exercises in the **`ark-lab` containerd namespace**. This is a grouping for containerd-managed objects, not a Linux kernel namespace and not a security boundary.

Do not use `ctr` or `nerdctl` to change Docker-managed objects, normally grouped under `moby`, or Kubernetes-managed objects under `k8s.io`. Talking to the same lower-level service does not make it safe to bypass the software managing those workloads.

### 3. Run a small verification

```bash
sudo nerdctl --address /run/containerd/containerd.sock \
  --namespace ark-lab run --rm docker.io/library/hello-world:latest
```

The confirmation should match the Docker smoke test, although nerdctl may need its own image download. This checks execution; the optional extension in [the application chapter](03-your-first-application.md#optional-run-the-application-through-containerd) checks the application and its port mapping.

</details>

## If a check fails

| Symptom | Check or action |
|---------|-----------------|
| Docker shows Client information but cannot reach Server | Start Docker Desktop, or check `sudo systemctl status docker` in the Linux lab |
| Permission denied on a Linux runtime socket | Use the documented `sudo` command; do not change socket permissions |
| nerdctl cannot reach containerd | Check `sudo systemctl status containerd` and the explicit socket path |
| nerdctl reports a missing CNI plugin | Check that the CNI installation succeeded and binaries exist under `/opt/cni/bin` |
| A published port is unreachable | First test from the runtime host; check binding, VM networking, and firewall rules |
| An image download fails | Read the registry error: DNS, proxy settings, credentials, rate limits, and platform availability are different problems |

For service startup errors, read the logs rather than reinstalling blindly:

```bash
sudo journalctl -u docker -u containerd -n 80 --no-pager
```

Docker and nerdctl create host networking rules. Do not assume that publishing a port is blocked by a host firewall just because ordinary host services are; the next chapter binds its web example only to loopback.

## Ready to continue

You are ready for the first experience when your chosen Docker setup returns Client and Server information and the smoke test succeeds. You do not need Compose or the optional containerd path for the first result. The recommended Linux packages include Compose for a later comparison; Docker Desktop bundles it too.

In [the application chapter](03-your-first-application.md), we'll serve a response, change its configuration, inspect evidence, and recover from a small failure.

## Installation references

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [nerdctl installation and dependencies](https://github.com/containerd/nerdctl#install)
- [nerdctl releases](https://github.com/containerd/nerdctl/releases)
- [CNI plugin releases](https://github.com/containernetworking/plugins/releases)
