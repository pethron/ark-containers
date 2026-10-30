# Docker and Linux Containers Course

**Preview: work in progress.** Module 01 has completed its first editorial review.
Core modules 02–03 and the optional Under the hood deep dives are drafts.
Core modules 04–09 are in preparation.
This public preview requests that search
engines do not index its pages; it is not private or access-controlled.

ARK starts with a working application, then helps you understand its mechanisms
and apply what you have learned to a different requirement. Docker is our first
tool throughout the main course. We'll also look at Linux isolation and Docker's
internal components; direct containerd use belongs to optional advanced labs.

## Start learning

[Open the first module](01-why-containers/README.md){ .md-button .md-button--primary }

You need basic terminal skills, one working Docker setup, and a browser or curl.
The [installation chapter](01-why-containers/02-installing-docker.md)
provides Windows, macOS and Linux routes. Local Python and a paid cloud account
are not prerequisites.

## Core course

The numbered modules are the reading order. You'll run and operate a service,
deliver it as an image, preserve its data, connect it to other services, then
harden and troubleshoot it. Each step includes the theory needed to explain
what happened and choose the next action.

| Module | Topic | Status |
|--------|-------|--------|
| 01 | [Why containers](01-why-containers/README.md) | Reviewed |
| 02 | [Running containers](02-running-containers/README.md) | Draft available |
| 03 | [Images and registries](03-images-and-registries/README.md) | Draft available |
| 04 | [Building images](04-building-images/README.md) | In preparation |
| 05 | [Storage](05-storage/README.md) | In preparation |
| 06 | [Networking](06-networking/README.md) | In preparation |
| 07 | [Compose](07-compose/README.md) | In preparation |
| 08 | [Security](08-security/README.md) | In preparation |
| 09 | [Production and troubleshooting](09-production-and-troubleshooting/README.md) | In preparation |

## Under the hood

These [advanced deep dives](advanced/README.md) are **optional, not requirements
for completing the core course or its final project**:

- [Linux primitives](advanced/linux-primitives/README.md)
- [Runtime architecture](advanced/runtime-architecture/README.md)
- [Images and distribution](advanced/images-and-distribution/README.md)

They start from the application you already know, investigate its mechanisms,
and return to it with observations to check. You can open a relevant deep dive
when you're curious; you don't need to read them between numbered modules.
Their Docker inspection exercises work with the main setup. The manual sandbox
and direct-containerd comparison have separate Linux VM prerequisites, stated
before their commands.

## Preview scope

Modules 01–03 offer Bash and native PowerShell 7 variants where syntax differs.
Their command tabs remember your selection across pages.
Introductory commands focus on the task, not a production hardening template.
Module 02 uses the original application for shell, process lifetime, stop/start
and replacement experiments. Signal-handling code is in advanced; resource
limits, retry policies and memory failures belong to module 09.
Module 03's required path is local tagging and archive restoration with the
already-downloaded image. Publication to a temporary local registry is optional.

The first application's Docker path has been tested on Windows amd64 using
Docker Desktop with native PowerShell 7 and Ubuntu WSL Bash: launch,
configuration changes, a deliberate port failure, recovery, simultaneous
instances, and scoped cleanup. The latest Bash run used the Windows Docker
client with host bind-source paths translated for that client.
Native Linux, macOS and arm64 still need platform-specific validation.

The unchanged application has also been checked with real interactive
PowerShell/ConPTY sessions: exiting an added shell left HTTP working,
stopping the main process ended another open shell, and the note survived
start/restart but not replacement. The revised module-03 archive round trip
preserved image identity and platform and served the expected message/health
using both PowerShell and WSL Bash. The optional registry's push/digest-pull
round trip preserved identity, and its temporary storage and anonymous-volume
cleanup were checked.
Earlier checks also covered platform-digest selection and the deep-dive
fixtures. Bash tests used the Windows Docker client from WSL because native
WSL integration was unavailable; integrated WSL paths remain a separate setup check.
No daemon restart, global prune or unrelated container cleanup was required.

On the same Docker Desktop setup, the deep dives' Docker exercises have also
been checked: namespace comparison and selective sharing, cgroup v2 limits,
process credentials and policy indicators, create/start/stop events, and the
distinction between client, runtime-start and application errors. The optional
manual sandbox and standalone-containerd lab still need execution in their
dedicated Linux VM environments.

The planned course covers operations, images and builds, storage, networking,
Compose, Linux primitives, runtime architecture, security and troubleshooting.

Download or clone the [course repository](https://github.com/pethron/ark-containers)
for the complete example files. The chapters on this site are rendered from
the same Markdown files, not a second edition maintained by hand.
