# Preview status

This page collects what the preview contains and how far its exercises have
been tested. You don't need it to follow the course; it's here so you can
judge how much to trust a draft before you rely on it.

## What's in the preview

Module 01 has completed its first editorial review. Core modules 02–07 and
the optional Under the hood deep dives are drafts, and the current scope
ends at module 07, with a separate optional Compose application workflow.
CI/CD and Kubernetes teaching are outside that scope. This public preview
asks search engines not to index its pages, but it isn't private or
access-controlled.

Modules 01–07 offer Bash and native PowerShell 7 variants where the syntax
differs. Introductory commands focus on the task, not on a production
hardening template.

Each module approaches the service from a different side:

- Module 02 uses the course image for shell, process lifetime,
  stop/start and replacement experiments. Signal-handling code is in the
  advanced section; production retry policy and memory-failure operations
  remain outside its task.
- Module 03's required path is local tagging and archive restoration with the
  already-downloaded image. No local registry is needed.
- Module 04 builds the course image from its recipe, compares the result with
  the published image and shows how to keep dependency installation cached
  after an application edit. Its
  optional Docker Hub runbook publishes your own image manually.
- Module 05 adds notes to the service and keeps them in a volume through
  replacement, compares bind mounts and tmpfs, and restores a backup into
  a new volume.
- Module 06 connects a frontend and API on a network you create, publishes
  only the frontend, and tells name failures from port failures by the
  frontend's answer.
- Module 07 moves that stack into a Compose file, and shows what Compose
  recreates on a change and which volumes survive `down`.
- The optional Compose application workflow runs an original reading-list
  application with Postgres and Nginx, then adds Redis, logical backup and
  restore, development through Watch and an isolated handover.

Selected chapters now include terminal images rendered from real Docker runs.
They show a few relevant lines rather than complete logs; annotations and
omitted build steps are identified.

## What has been tested

The table summarizes where the exercises have run. "Checked" means the
commands were executed and their results compared with the chapters; it
doesn't mean every variation of every kata was tried.

| Platform | Shell | Core modules 01–07 | Final project | Under the hood | Advanced Compose |
|----------|-------|--------------------|---------------|----------------|------------------|
| Windows amd64, Docker Desktop | PowerShell 7 | Checked | Reference solution and all incidents checked | Docker exercises checked | Container tests, integration, Watch and native backup checked |
| Windows amd64, Docker Desktop | Bash in WSL or Git Bash, Windows Docker client | Checked | Not yet | Docker exercises checked | Not yet |
| Linux amd64, Docker Engine (GitHub Actions) | Bash | Automated smoke checks, from the first run of the lab workflow | Starter unit tests | Not yet | Workflow configured; new run not yet |
| Linux amd64, Docker Engine on a workstation | Bash | Not yet | Not yet | Manual sandbox and containerd labs not yet | Not yet |
| macOS, Docker Desktop (Apple silicon or Intel) | Bash or zsh | Not yet | Not yet | Not yet | Not yet |
| Linux arm64 | Bash | Not yet | Not yet | Not yet | Not yet |

The automated checks in `scripts/check_labs.py` run each fixture's unit tests
and then, with Docker, start every module's service the way its chapters do:
the message service image built from the module 04 recipe, the other images built in module 04,
notes surviving a replacement in a volume, two services talking over a
network, and the Compose stack. They show that the supplied files still work;
they don't replace running a chapter by hand, which is where a missing step
or a misleading output shows up.

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
