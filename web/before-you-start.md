---
title: "Before you start"
track: runbook
---

# Before you start

Every chapter of the course works on files we supply: a small service to run,
a Dockerfile to read, a stack to start. Before the first chapter, then, your
machine needs two things: a Docker installation that runs Linux containers and
a copy of the course repository. We set up both once, on this page. From then
on, the chapters assume they're in place and only tell you which folder to open.

## What you need

| Tool | Used for |
|------|----------|
| Docker Desktop (Windows, macOS) or Docker Engine (Linux) | Every module |
| A terminal: Bash, or PowerShell 7 on Windows | Every module |
| Git, or a way to download a ZIP | Getting the course files, used from module 04 |
| A browser or `curl` | Talking to the services you run |
| Python 3.10 or later | Only the final project's tests and incident tool |
| A Docker Hub account | Only the optional publishing page in module 04 |
| A Linux machine or VM where you can use `sudo` | Only the hands-on labs in **Under the hood** |

You don't need Python for the modules, because the images we run already
contain it. The last three rows can wait until you reach those parts of the
course.

## Choose your shell

The course provides **Linux (Bash)** and **Windows (PowerShell)** command tabs.
Choose your shell once; the site remembers that choice across pages. You can
change it at any time. Windows examples use **PowerShell 7**, not Command Prompt
or Windows PowerShell 5.1; follow the
[official PowerShell installation guide](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows)
if needed.

On macOS, use the Bash commands with Docker Desktop, without `sudo`. WSL is an
optional way to follow the Bash examples on Windows, not a required terminal.
Later modules are still being adapted to these paired command tabs.

## Install Docker

If you already have a working installation, check it with `docker version` and
skip to [Check the installation](#check-the-installation). There is no need to
set up a second environment just for this course.

| Your machine | Start here |
|--------------|------------|
| Windows or macOS | Docker Desktop, running Linux containers |
| Linux | Docker Engine, following the guide for your distribution |

For now, use whichever is easiest on your machine. Later, when we inspect Linux
kernel features directly, we'll need a Linux host or VM we can administer. You
don't need to prepare that before running your first application.

### Windows and macOS: Docker Desktop

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

That's enough setup. Continue to [Check the installation](#check-the-installation).

### Linux: Docker Engine

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
container when it finishes. If that works, Docker is ready, and what's missing
is the material to run on it.

## Get the course files

The exercises live in the
[course repository](https://github.com/pethron/ark-containers). Cloning it with
Git is the simplest way to get them, and later lets you pick up corrections
with `git pull`. The first three modules run a ready-made image downloaded from
the course's registry and need nothing from the repository, so if you'd rather
start right away, you can come back here before module 04. Open a terminal in the directory where you want to keep the
course and run:

```text
git clone https://github.com/pethron/ark-containers.git
cd ark-containers
```

Without Git, download the repository as an archive instead. It extracts to a
folder named `ark-containers-main`:

=== "Linux (Bash)"

    ```bash
    curl -fsSL https://github.com/pethron/ark-containers/archive/refs/heads/main.tar.gz | tar -xz
    cd ark-containers-main
    ```

=== "Windows (PowerShell)"

    ```powershell
    Invoke-WebRequest -Uri https://github.com/pethron/ark-containers/archive/refs/heads/main.zip -OutFile ark-containers.zip
    Expand-Archive ark-containers.zip -DestinationPath .
    Set-Location .\ark-containers-main
    ```

You can also choose **Code → Download ZIP** on the repository page, extract it
wherever you like and open a terminal inside the extracted folder.

Whichever way you downloaded it, the folder your terminal is in now is what the
chapters call the **root of your course checkout**. It holds one folder per
module, so listing it is a quick check:

=== "Linux (Bash)"

    ```bash
    ls
    ```

=== "Windows (PowerShell)"

    ```powershell
    Get-ChildItem -Name
    ```

You should see `01-why-containers`, `02-running-containers` and the other
module folders. Each module starts from here and tells you which folder to move
into, so when you open a new terminal on another day, come back to this folder
first.

!!! success "Checkpoint"

    `docker version` shows both Client and Server, `hello-world` printed its
    confirmation, and your terminal is in the course folder, next to
    `01-why-containers`.

## If something doesn't work

| What you see | What to check |
|--------------|---------------|
| Client information, but no Server | Start Docker Desktop, or check `sudo systemctl status docker` on Linux |
| Permission denied on the Docker socket | Use `sudo docker` on the Linux setup; don't make the socket world-writable |
| The image download fails | Read the registry error: check connectivity, proxy settings or rate limits as appropriate |
| The Linux service won't start | Read `sudo journalctl -u docker -n 80 --no-pager` |
| `git` is not recognized | Install Git, or download the archive instead |
| A chapter can't find a folder such as `04-building-images/message-service` | Return to the root of your course checkout before the chapter's first `cd` |

Don't expose an unauthenticated Docker API to fix a connection problem. The
client should use your local setup; rootless access is a separate topic for later.

With Docker running and the files in place, you're ready for
[the first module](01-why-containers/README.md).
