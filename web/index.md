# Docker and Linux Containers Course

Sooner or later, a service that works on your machine has to run somewhere
else: on a colleague's laptop, on a test server, in a pipeline that builds it
at every change. Each of those places has its own operating system, its own
version of Python and its own idea of which port is free, and the "it works
for me" that held on your machine stops holding there. Containers are the
answer the industry settled on, and today almost every deployment, from a
small team's server to a larger application deployment, assumes you can package a
service as an image and run it as a container.

Knowing a handful of Docker commands gets you surprisingly far, until
something goes wrong. A container that exits immediately, a port that answers
nothing, data that disappears after an update: these are everyday problems,
and solving them requires understanding what a container is and what it
shares with the machine underneath. That's the goal of this course. We'll use
Docker to do the work, and at each step we'll explain enough of what happened
to let you choose the next action yourself.

**Preview: work in progress.** Module 01 has completed its first editorial
review; modules 02–07 and the optional advanced material are drafts.
The [preview status](preview-status.md) page lists what has been tested so far.

## What you'll do

The course follows a small service from the moment it first runs in a
container to a complete stack. You'll start it and reach it from the browser,
then keep it running and replace it with a new version. You'll package it as
an image and hand it to a colleague, write the recipe that builds it, keep its
data safe across replacements, connect it to a second service and finally
describe the whole stack in a single file. The core finishes with an unfamiliar
application to package, diagnose and change.

| Module | Topic | Status |
|--------|-------|--------|
| 01 | Why containers | Reviewed |
| 02 | Running containers | Draft available |
| 03 | Images and registries | Draft available |
| 04 | Building images | Draft available |
| 05 | Storage | Draft available |
| 06 | Networking | Draft available |
| 07 | Compose | Draft available |

## How the course works

Each module starts from scratch with its own files and its own working
service, so you can open module 05 without keeping anything from module 04.
Within a module, the chapters continue one another: the container you start in
one chapter is still running in the next, so follow them in order and keep
the terminal open in the module's folder. In the first module, where every
command is new, green **Checkpoint** boxes mark the state you should have
reached before moving on.

Most chapters are practical: you run a command, observe what happens and only
then look at why. At the end of each module, a kata gives you a similar
problem without step-by-step instructions, so you can check that you can solve
it on your own, and a short *Check your understanding* page asks you to
predict, diagnose and decide before showing the explanation. When you pause,
keep what the next chapter needs and clean up when you finish the module.

When the seven modules are done, the [final project](capstone/README.md)
gives you a small application you haven't seen before: you package it, run
it, keep its data, diagnose an incident introduced on purpose and handle a
changed requirement. A published [rubric](capstone/rubric.md) explains how
it's assessed. The [syllabus](syllabus.md) lists what you'll be able to do at
the end of each module, and the [glossary](glossary.md) collects the terms
the course defines along the way.

The **Under the hood** section collects optional deep dives into Linux
namespaces and cgroups, the runtime components behind `docker run`, image
distribution, advanced builds and container networking. You don't need them
to complete the course; open one when a question from the exercises makes you
curious.

If you want a fuller application workflow, **Compose application workflows**
adds a database, a disposable cache and a reverse proxy to an original
reading-list service. You'll run the stack before investigating readiness,
backup and restore, cache behavior, source synchronization and dependency
rebuilds. It follows the skills from modules 04–07, starts with its own files
and resources, and doesn't change the final project's assessment.

## Before you start

You need basic terminal skills, one working Docker setup, the course files and
a browser or curl. You don't need Python installed locally or a cloud account
for the modules or the advanced Compose workflow. Where Bash and PowerShell 7
differ, the commands come in tabs that remember your choice across pages.
[Before you start](before-you-start.md) installs Docker on Windows, macOS or
Linux, downloads the course files and lists the few extra tools that only
later parts of the course need.

[Set up your machine](before-you-start.md){ .md-button .md-button--primary }
