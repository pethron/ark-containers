# Preview status

This page collects what the preview contains and how far its exercises have
been tested. You don't need it to follow the course; it's here so you can
judge how much to trust a draft before you rely on it.

## What's in the preview

Module 01's existing chapters have completed their first editorial review.
The fast tracks, core modules 02–07 and the optional Under the hood deep dives
are drafts, and the current scope
ends at module 07, whose second part runs a Compose reading-list application.
The final project is temporarily excluded from this preview.
CI/CD and Kubernetes teaching are outside that scope. This public preview
asks search engines not to index its pages, but it isn't private or
access-controlled.

Modules 01–07 offer Bash and native PowerShell 7 variants where the syntax
differs. Introductory commands focus on the task, not on a production
hardening template.

Each core module has a fast track that collects its essential operational
steps on one page. It is an optional first pass, not evidence that the full
module outcomes or independent kata have been achieved.

Each module approaches the service from a different side. Modules 02–07
follow the practical work with a **How it works** group before the kata:

- Module 02 uses the course image for shell, process lifetime,
  stop/start and replacement experiments, then connects them to the engine,
  namespaces and resource limits. Production retry policy and
  memory-failure operations remain outside its task.
- Module 03's required path is local tagging and archive restoration with the
  already-downloaded image, followed by layers, manifests and registry
  delivery. No local registry is needed.
- Module 04 builds the course image from its recipe, compares the result with
  the published image and shows how to keep dependency installation cached
  after an application edit. It then follows a multi-stage BuildKit recipe.
  Its optional Docker Hub runbook publishes your own image manually.
- Module 05 adds notes to the service and keeps them in a volume through
  replacement, compares bind mounts and tmpfs, and restores a backup into
  a new volume. It uses that result to inspect mounts and ownership.
- Module 06 connects a frontend and API on a network you create, publishes
  only the frontend, and tells name failures from port failures by the
  frontend's answer. The architecture chapters follow name resolution and
  both network paths.
- Module 07 moves that stack into a Compose file, and shows what Compose
  recreates on a change, how it identifies its resources and which volumes
  survive `down`. Its **Compose in practice** group then runs an original
  reading-list application with Postgres and Nginx, adding Redis, logical
  backup and restore, development through Watch and an isolated handover.
  The module's fast track covers that application.

Selected chapters now include terminal images rendered from real Docker runs.
They show a few relevant lines rather than complete logs; annotations and
omitted build steps are identified.

## What has been tested

The table records earlier walkthroughs, before the architecture integration
in modules 02–07. "Checked" means commands were executed and their results
compared with those earlier chapters; it doesn't mean every kata variation or
the entire revised sequence has been tried. The newer checks and their limits
are listed below.

| Platform | Shell | Core modules 01–07 | Under the hood | Advanced Compose |
|----------|-------|--------------------|----------------|------------------|
| Windows amd64, Docker Desktop | PowerShell 7 | Checked | Docker exercises checked | Container tests, integration, Watch and native backup checked |
| Windows amd64, Docker Desktop | Bash in WSL or Git Bash, Windows Docker client | Checked | Docker exercises checked | Not yet |
| Linux amd64, Docker Engine (GitHub Actions) | Bash | Earlier automated smoke checks; revised checks not yet run here | Not yet | Workflow configured; new run not yet |
| Linux amd64, Docker Engine on a workstation | Bash | Not yet | Manual sandbox and containerd labs not yet | Not yet |
| macOS, Docker Desktop (Apple silicon or Intel) | Bash or zsh | Not yet | Not yet | Not yet |
| Linux arm64 | Bash | Not yet | Not yet | Not yet |

The automated checks in `scripts/check_labs.py` run the fixtures' unit tests
and Docker smoke checks for the message image and archive, notes and their
volume, a networked frontend and API, and the Compose stack. They also check
selected mount, ownership, recovery and Compose recreation evidence. These
checks show that the supplied files and selected operations work; they don't
replace running each chapter by hand, which is where a missing step or a
misleading output can show up.

### Fast-track checks

The seven fast tracks were run from start through cleanup on Windows amd64
with Docker Desktop, using native PowerShell 7.6.9 and Ubuntu WSL Bash 5.1
with the Linux Docker client. Both used the same Desktop engine, version
29.6.1. Runs used isolated names, tags and free alternate ports; the Compose
check used a temporary copy of its stack with a different host port.

The checks included the wrong-port and network failures, recovery, image
archive identity, a writable restored notes volume, retained handover and
backup files, and forced recreation of only the Compose frontend. An
additional occupied-port test confirmed that the storage page's running-state
check catches a failed launch. Existing course containers were left unchanged.

These are checks of the fast-track instructions, not the complete guided
chapters or a learner study. A cold download or transfer to a second machine,
native Linux Engine, macOS and arm64 runs remain unverified. The new prose
has not yet been approved by the author.

### Architecture integration checks

The revised lab checks passed on Windows amd64 with Docker Desktop, once from
PowerShell 7 and once from Ubuntu WSL with the Linux Docker client. Both used
the same Desktop engine. Additional isolated runs checked the CPU and memory
settings on cgroups v2, the archive manifest with `tar`, the two BuildKit
stages and their HTTP result, mount visibility and ownership, network
interfaces and recovery, and Compose labels, events and selective
recreation. The registry challenge and public multi-platform manifest were
also inspected. Selected Bash and PowerShell commands were run directly;
not every revised chapter has been followed from its start through cleanup
in both shells.

The production site build and local navigation checks cover rendering and
links, not whether students learn from the sequence or whether the author
approves its voice. The revised sequence has not been run on a native Linux
engine, macOS or arm64.

### Details of the manual runs

The first application's Docker path has been tested on Windows amd64 using
Docker Desktop with native PowerShell 7 and Ubuntu WSL Bash: launch,
configuration changes, a deliberate port failure, recovery, simultaneous
instances, and scoped cleanup. The latest Bash run used the Windows Docker
client with host bind-source paths translated for that client.

The unchanged application has also been checked with real interactive
PowerShell/ConPTY sessions: exiting an added shell left HTTP working,
stopping the main process ended another open shell, and the note survived
start/restart but not replacement. The revised module-03 archive round trip
preserved image identity and platform and served the expected message/health
using both PowerShell and WSL Bash.
Earlier checks also covered platform-digest selection and the deep-dive
fixtures. Bash tests used the Windows Docker client from WSL because native
WSL integration was unavailable; integrated WSL paths remain a separate setup check.
No daemon restart, global prune or unrelated container cleanup was required.

Module 04's labs passed on Docker Desktop Linux amd64 with native PowerShell 7
and Git Bash using the Windows Docker client.

Modules 01–03 have since moved from a mounted `app.py` to the published course
image, `ghcr.io/pethron/ark-message:1`. The new launches were checked on Docker
Desktop with the lab checks and the terminal captures, using a local build of
that image before its first publication; the shell-by-shell runs described
above predate the change, and pulling the published multi-platform image
hasn't been checked yet.

The optional Docker Hub recipe passed local build, tag identity, platform,
non-root user, source-mount absence and HTTP checks. Account login, remote
upload and retrieval on a cold second machine were not executed.

The advanced Compose runner passed nine container unit tests and integrated
checks on Windows/Docker Desktop: delayed and blocked startup, bounded dependency
failure and reconnect, record survival, byte-safe logical restore and independent
projects, cache hits/misses and invalidation through an actual retained-stale-key
partition, proxy re-resolution after a proven address change, CRUD and routing
faults, and both Watch actions. Native PowerShell backup hashes also matched.
These are fixture and selected-command checks, not a claim that every chapter
has been followed by a learner or that native Bash has been validated.

On the same Docker Desktop setup, the deep dives' Docker exercises have also
been checked: namespace comparison and selective sharing, cgroup v2 limits,
process credentials and policy indicators, create/start/stop events, and the
distinction between client, runtime-start and application errors. The optional
manual sandbox and standalone-containerd lab still need execution in their
dedicated Linux VM environments.

The versions used for these runs are listed on the
[references](references.md#software-versions) page.

[Back to the start page](index.md)
