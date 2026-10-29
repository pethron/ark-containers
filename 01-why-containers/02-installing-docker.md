---
title: "Installing Docker"
track: runbook
---

# Installing Docker

We need one working Docker installation before running the application. If you
already have one, check it with `docker version` and skip to the installation
check below. There is no need to set up a second environment just for this chapter.

Module 01 provides **Linux (Bash)** and **Windows (PowerShell)** command tabs.
Choose your shell once; the site remembers that choice across pages. You can
change it at any time. Windows examples use **PowerShell 7**, not Command Prompt
or Windows PowerShell 5.1; follow the
[official PowerShell installation guide](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows)
if needed.

On macOS, use the Bash commands with Docker Desktop, without `sudo`. WSL is an
optional way to follow the Bash examples on Windows, not a required terminal.
Later modules are still being adapted to these paired command tabs.

## Choose one setup

| Your machine | Start here |
|--------------|------------|
| Windows or macOS | Docker Desktop, running Linux containers |
| Linux | Docker Engine, following the guide for your distribution |

For now, use whichever is easiest on your machine. Later, when we inspect Linux
kernel features directly, we'll need a Linux host or VM we can administer. You
don't need to prepare that before running your first application.

## Windows and macOS: Docker Desktop

1. Follow the official installer for [Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
   or [macOS](https://docs.docker.com/desktop/setup/install/mac-install/), choosing
   the download for your CPU architecture.
2. Start Docker Desktop and wait for the engine to be ready. On Windows, use
   Linux containers. Docker Desktop may use WSL 2 internally, but you can run
   the course commands directly from PowerShell.
3. Check that the engine is reachable:

   ```text
   docker version
   docker info --format '{{.OSType}}'
   ```

The first command must show both **Client and Server** information, and the
second must print `linux`. Having the client installed is not enough: it needs
an engine to talk to.

If you prefer a WSL terminal, enable Docker Desktop's integration for that
distribution instead of installing a second Engine inside it. If you are using Desktop
at work, check its [subscription terms](https://docs.docker.com/subscription/desktop-license/).

That's enough setup. Continue to **Check the installation** below.

## Linux: Docker Engine

Follow the official [Docker Engine installation guide](https://docs.docker.com/engine/install/)
and choose your distribution. If you're using Ubuntu, go straight to the
[Ubuntu guide](https://docs.docker.com/engine/install/ubuntu/).
Use a machine you can safely change, not a production server or an existing
Kubernetes node. If another container runtime is already installed, read the
guide's package-conflict instructions before removing anything.

If you're creating a VM for the course, two virtual CPUs, 4 GB of RAM and 20 GB
of available disk are a reasonable starting allocation for the introductory
labs. They're not a promise that every later workload will fit.

Once you've finished the official guide, check that the client can reach the
engine and that it runs Linux containers:

```bash
sudo docker version
sudo docker info --format '{{.OSType}}'
```

You should see both **Client and Server** information, followed by `linux`.

In the Linux examples, prefix Docker commands with `sudo` if your Engine setup
requires it; with Docker Desktop, use `docker` without `sudo`. Here, `sudo`
asks to run the Docker client with administrator permissions on the host.
This is separate from `--user`, which chooses the application's user inside
the container. Access to a rootful Docker daemon effectively gives administrative
access to its host. Adding yourself to the `docker` group avoids typing `sudo`,
but does not make that access unprivileged, so we won't use it as a shortcut.

## Check the installation

On Linux Engine, run:

```bash
sudo docker run --rm docker.io/library/hello-world:latest
```

On Docker Desktop, run:

```text
docker run --rm docker.io/library/hello-world:latest
```

Docker downloads the image if necessary, runs its program, prints a confirmation and removes the
container when it finishes. If that works, we can move on to something useful.

Download the course files if you haven't already. From the directory where you
want to keep the checkout, run:

```text
git clone https://github.com/pethron/ark-containers.git
cd ark-containers
```

You can also download the repository as a ZIP from GitHub and open a terminal in
the extracted directory. You don't need Python installed locally: Docker will
provide it for the application.

## If something doesn't work

| What you see | What to check |
|--------------|---------------|
| Client information, but no Server | Start Docker Desktop, or check `sudo systemctl status docker` on Linux |
| Permission denied on the Docker socket | Use `sudo docker` on the Linux setup; don't make the socket world-writable |
| The image download fails | Read the registry error: check connectivity, proxy settings or rate limits as appropriate |
| The Linux service won't start | Read `sudo journalctl -u docker -n 80 --no-pager` |

Don't expose an unauthenticated Docker API to fix a connection problem. The
client should use your local setup; rootless access is a separate topic for later.

Ready? In [the next chapter](03-your-first-application.md), we'll run a small HTTP
service and change what it does, not just check that Docker starts.
