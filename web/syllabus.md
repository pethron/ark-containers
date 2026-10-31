# Syllabus

This page is for anyone who needs to know, before starting, what the course
asks and what it leaves you able to do: a student checking whether it fits a
Cloud Computing curriculum, an instructor adopting it, or a professional
deciding where to begin. The course itself is built around doing the work, so
the outcomes below describe things you can show on a running system rather
than topics you have read about.

## Who it's for

The course is written for university students in cloud and systems courses
and for working developers and operators who use containers without being
sure of what happens underneath. Both groups start from the same first
module, run the same exercises and are assessed by the same criteria.

## What you need before starting

- **Terminal and files.** You can move between directories, run a command,
  read its output and edit a text file.
- **One working Docker setup.** Docker Desktop on Windows or macOS, or Docker
  Engine on Linux, running Linux containers. [Before you start](before-you-start.md)
  covers each platform and how to download the course files.
- **A browser or curl** to talk to the services you run.

You don't need Linux administration, a paid cloud account or local Python for
the core modules. Ideas such as processes, users, permissions, ports and name
resolution are explained when an exercise first needs them. Two parts of the
course ask for more, and say so where they begin: the hands-on labs in
**Under the hood** need a Linux machine or virtual machine where you can use
`sudo`, and the final project needs Python 3.10 or later to run the starter's
tests and its incident tool.

## What you'll be able to do

By the end of the core course and the final project, you can:

1. **Run and diagnose a containerized service**, using its state, logs and
   responses to tell a configuration mistake from an unreachable port or a
   process that has stopped.
2. **Explain what a container is** in terms of processes, namespaces, cgroups
   and a layered filesystem, and compare it with a virtual machine for a
   given risk or workload.
3. **Identify and hand over an image** so that whoever receives it can check
   that they run the same content you tested.
4. **Write a Dockerfile for a service** and justify its build context, cache
   behavior, user and startup command.
5. **Keep data across replacements**, choosing between a volume, a bind mount
   and a tmpfs mount, and prove it with a backup you have restored.
6. **Connect services privately** on a network of their own, publish only the
   entry point and distinguish a name-resolution failure from a wrong port.
7. **Describe a multi-service application in Compose** and predict what
   `up` and `down` create, recreate and remove.
8. **Diagnose an unfamiliar incident and justify the recovery**, choosing
   between restarting, replacing and restoring from the evidence.

## Module by module

Each module states its task in its overview and practises it in its chapters.
The table lists what you can do at the end of each module and where you show
it without step-by-step help.

| Module | At the end, you can... | Shown in |
|--------|------------------------|----------|
| 01 Why containers | Start, configure and reach a supplied service; diagnose a wrong port; run a second instance; explain the trade-offs between physical servers, virtual machines and containers | Kata: a service handover |
| 02 Running containers | Look inside a running container; explain what keeps it alive; tell restarting from replacing; stop a service cleanly and choose the right fix for a configuration mistake | Kata: a repeatable service change |
| 03 Images and registries | Find the image behind a container; tell names from content; explain layers; save, load and verify an image; choose the reference to hand over | Kata: artifact handover |
| 04 Building images | Package a service with a Dockerfile; keep the build context deliberate; read the build cache; choose a startup command that receives stop signals | Kata: a build you can hand over |
| 05 Storage | Give a service a volume; explain what survives stop, removal and replacement; choose between a volume, a bind mount and tmpfs; back up and restore data | Kata: notes from the old release |
| 06 Networking | Connect two services by name on a network you create; publish only the entry point; diagnose name and port failures | Kata: reconnect the services |
| 07 Compose | Describe a stack in `compose.yaml`; explain project names, service names and selective recreation; predict what `down` and `down -v` remove | Kata: add the notes service |

## Optional application workflow

After the build, storage, networking and Compose skills in modules 04–07,
[Compose application workflows](advanced/compose-workflows/README.md) asks you
to operate a supplied reading-list application with PostgreSQL, Redis and
Nginx. You can show that you can:

- Read an official image's documentation and turn its user, initialization,
  configuration and data-directory requirements into Compose settings.
- Distinguish startup ordering from continuing readiness and recover a
  dependency without treating an initial health check as permanent protection.
- Restore a logical database backup into an independent project and verify
  it through the application.
- Observe cache hits, expiration and invalidation, then replace the cache
  without losing database records.
- Synchronize a source edit and rebuild after a dependency change with
  Compose Watch, while preserving a non-root application user.
- Follow a failure through the reverse proxy, application and dependencies,
  and hand over a second isolated project on an adjacent loopback port.

The supplied application has its own fixtures and needs Docker, Compose and
internet access to retrieve images, not a local database installation or a
cloud account. Its kata checks that workflow separately; the core capstone
and rubric remain unchanged.

The optional [Docker Hub runbook](04-building-images/optional/publish-to-docker-hub.md)
adds manual publication of your own application image after module 04. It
requires an account and upload permission. CI/CD pipelines, Kubernetes and a
production security curriculum remain outside the current course.

## How the course works

Each module starts from zero, with its own files and its own working service.
Within a module the chapters continue one another, so follow them in order.
Chapters carry a track label: **Architecture** chapters explain a mechanism
behind something you have just observed, **Runbook** chapters give a usable
route to a result with its checks and cleanup, and **Katas** hand you a
problem with acceptance criteria and hints instead of a recipe.

The **Under the hood** section is optional depth. Everything you need to
complete the exercises and the final project is in the core modules; the deep
dives are where to go when you want to see how namespaces, cgroups, runtimes
or image formats work in detail.

## How you check your progress

Learning is checked in three ways, from the lightest to the most demanding:

- **Check your understanding.** Each module ends with a few prediction,
  diagnosis and decision questions. Answer from memory, then open the
  explanation. They aren't graded: a wrong answer tells you which chapter to
  reread.
- **Katas.** Each module has at least one task with acceptance criteria and
  graduated hints. You're done when the criteria hold, whichever route you
  took.
- **The final project.** The [final project](capstone/README.md) asks you to
  package, run, connect and preserve a two-service application you haven't
  seen before, diagnose an incident introduced on purpose and handle a changed
  requirement. It's assessed with a published [rubric](capstone/rubric.md)
  that looks at the working result, the evidence and your reasoning.

## Sources and versions

The [references](references.md) page lists the specifications, documentation
and papers the course relies on, and the software versions the exercises were
checked with. The [glossary](glossary.md) defines the terms used across
modules, each linked to the chapter where it's explained.
