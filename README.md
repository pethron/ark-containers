# ARK: Containers

A course on Linux containers, using **Docker** throughout the main learning path.
We'll also explain how the client and engine turn a command into running
processes, and how Linux supplies their resource and isolation boundaries.

You can read the chapters here on GitHub, or in the
[public preview](https://pethron.github.io/ark-containers/) of the website.
Both are work in progress: module 01's existing chapters have completed their
first editorial review; the fast tracks, modules 02–07 and the optional
advanced material are drafts.

## How the course is built: ARK

The course is a sequence of modules, and each module is a sequence of chapters. Every chapter belongs to one of three tracks, **ARK**:

| | Track | For whom | What you get |
|---|-------|----------|--------------|
| **A** | **Architecture** (*Deep Dive*) | You want to understand what happens under the hood | Kernel namespaces, cgroups, OverlayFS, networking internals, OCI. No shortcuts. |
| **R** | **Runbook** | You want to do the task step by step | Commands, working configurations and checks of their results. |
| **K** | **Katas** (*Hands-On*) | You learn by doing | Exercises of increasing difficulty: broken setups to fix, apps to containerize. |

These are complementary views, not an obligatory A → R → K sequence. The guided
path starts with a small working application, then returns to its mechanisms,
trade-offs and harder variations. Each module's README connects the chapters
and marks their tracks. Within the guided path, follow chapters in order so
each one can build on the state and reasoning from the previous one.

Expect to predict outcomes, make controlled mistakes, inspect evidence, and adapt
examples to a changed requirement. Technical depth remains part of the course,
but is not an admission requirement for the first useful result.

## Core course

Modules **01 → 07** form the current course: run a service, operate it,
package it, keep its data, connect it and describe the stack with Compose.
The numbering is the suggested module order, but you can choose a module by
the question you want to answer. After [setting up Docker](web/before-you-start.md),
use a module's fast track for a short operational pass, or start with its first
practical chapter for the full guided path. Each module brings its own files;
the guided chapters carry their state from one chapter to the next.

The fast tracks summarize the essential commands and finish with scoped
cleanup. They don't replace the explanations, independent practice or full
outcomes of the modules. The cleanup removes the fast track's containers, so
start a guided module from its first chapter rather than its later steps.

The core includes the theory needed to explain observations and justify
decisions, not just commands to copy. You don't need the optional deep dives
to complete the course.

The [syllabus](web/syllabus.md) lists the prerequisites and what you'll be
able to do at the end of each module. Every module closes with an ungraded
*Check your understanding* page and includes a kata with acceptance criteria. The
[glossary](web/glossary.md) and the [references](web/references.md), with
the software versions the exercises were checked with, cover the whole course.

| # | Module | Fast track | Guided chapters |
|---|--------|------------|-----------------|
| 01 | [Why containers](01-why-containers/) | [Start](01-why-containers/fast-track.md) | Reviewed |
| 02 | [Running containers](02-running-containers/) | [Start](02-running-containers/fast-track.md) | Draft |
| 03 | [Images and registries](03-images-and-registries/) | [Start](03-images-and-registries/fast-track.md) | Draft |
| 04 | [Building images](04-building-images/) | [Start](04-building-images/fast-track.md) | Draft |
| 05 | [Storage](05-storage/) | [Start](05-storage/fast-track.md) | Draft |
| 06 | [Networking](06-networking/) | [Start](06-networking/fast-track.md) | Draft |
| 07 | [Compose](07-compose/) | [Start](07-compose/fast-track.md) | Draft |

## Compose in practice

Module 07 continues with [a reading-list application](advanced/compose-workflows/README.md)
that starts with PostgreSQL and Nginx, adds Redis as a disposable cache, and
follows configuration, readiness, logical backup and restore, Compose Watch
development and an isolated handover. Its files live under
`advanced/compose-workflows/` and its resources are independent of the small
Compose stack. The module's fast track runs this
application.

After module 04, the optional [Docker Hub runbook](04-building-images/optional/publish-to-docker-hub.md)
publishes an application image in your own namespace. It requires an account
and upload permission; all required core exercises and the advanced Compose
workflow remain account-free. CI/CD pipelines and Kubernetes teaching are
outside the current scope.

## Under the hood: optional advanced deep dives

Want to understand how Linux and the runtime arrange those boundaries?
[Under the hood](advanced/README.md) connects advanced explanations and
experiments to the same application:

- [Namespaces](advanced/linux-primitives/02-namespaces.md) and
  [cgroups](advanced/linux-primitives/03-cgroups-v2.md): process views and
  resource controls.
- [Images and distribution](advanced/images-and-distribution/README.md):
  versioning conventions, layers, manifests, registries and platform compatibility.
- [Image builds](advanced/image-builds/README.md): multi-stage builds,
  BuildKit cache mounts and reproducible inputs.
- [Container networking](advanced/container-networking/README.md): network
  namespaces, bridges, published ports and the other network drivers.

These are not numbered steps in the core course. Open them when a mechanism
interests you, then return to the application with a prediction or observation
to check. Linux VM prerequisites apply only to the experiments that name them.

## Layout

Numbered directories contain the core course. Optional deep dives live under
`advanced/`, with the same chapter, image and kata layout:

```
NN-module/
├── README.md        objectives, chapter list with tracks, katas
├── fast-track.md    short operational route through the module
├── 01-<chapter>.md  front matter: title, track (architecture | runbook)
├── 02-<chapter>.md
└── katas/
    └── kata-NN-<name>/
        ├── README.md   scenario and goal (track: kata)
        ├── starter/    work here
        └── solution/   try first, peek later
```
## When you return

When you pause, leave in place what the next chapter needs and follow the
cleanup at the end of the module. You can move to another module without
carrying containers, images or data from this one.

## Read the site locally and publish it

The site uses Docusaurus and GitHub Pages from this repository only. The build
stages the chapter Markdown and the pages in `web/`, including the
[preview status](web/preview-status.md) with the platforms and labs tested so
far. Don't edit the generated `.site-docs/`, `static/` or `build/` directories.

To read the course locally, install Node.js 20 or later and run
this from the course root, in Bash or PowerShell:

```bash
npm ci
npm start
```

Open the address printed by Docusaurus. Press Ctrl+C to stop the server;
restart after editing a source chapter so it is staged again. To check the
static GitHub Pages output locally instead:

```bash
npm run build
npm run serve
```

The preview server listens on `http://127.0.0.1:4173/ark-containers/`.
The build includes modules 01–07 and the advanced material. The final project
is temporarily excluded from the site; its sources remain in `capstone/`.
Historical project URLs redirect to module 07. Source chapters retain the
existing Bash/PowerShell markup; a tested staging adapter supplies Docusaurus
tabs without making React a
requirement for writing course prose.

The build inserts and verifies
`noindex, nofollow` on every generated HTML page, including the error page.
This asks compliant crawlers not to index the preview; it is not privacy or
authentication. Use `npm run build` rather than bypassing the staging and
publication checks.

To check that the exercise files still work, run the lab checks from the
course root. They run each fixture's unit tests and, with Docker available,
start every module's service in uniquely named containers that are removed
afterwards; `--no-docker` runs only the unit tests. The **Check labs**
workflow runs the same script on Linux for every push and pull request.

```bash
python scripts/check_labs.py
```

Module 07's reading-list application has a separate check runner:

```bash
python scripts/check_compose_workflows.py
```

### Refresh the terminal images

Selected terminal cards come from actual Docker commands. The script saves the
capture data as JSON and renders an SVG beside it, with the full captured text
in the image description. Run this only after reviewing the labs:

```bash
node scripts/capture_terminal.mjs --verify-only
node scripts/capture_terminal.mjs
```

The capture script uses loopback port 8080 and the named core lab resources;
it refuses existing container names and image tags rather than replacing
someone else's work. If Docker storage was cleaned after the labs, run
`docker pull python:3.12-alpine` first. Build-cache edits happen in a temporary fixture copy.
Setup and unrelated build steps are omitted explicitly from the selected
images, and identifiers and timings are never replaced with invented values.
It performs no Docker Hub login or upload. To rerender an existing capture
without running Docker:

```bash
node scripts/render_terminal.mjs 01-why-containers/images/terminal-first-service.json
```

Publication is manual: run **Publish course preview** from GitHub Actions after
pushing reviewed changes. Pushes alone do not deploy, so the live preview
changes only after an explicit publication. GitHub Pages must use
**GitHub Actions** as its source. Before a production launch, remove the preview
indexing policy intentionally and verify the resulting HTML.

## Credits

The teaching approach is inspired by
[fast.ai's teaching philosophy](https://www.fast.ai/posts/2016-10-08-teaching-philosophy.html)
and its discussion of David Perkins's *Making Learning Whole*: start with a
manageable whole task, investigate its parts, and return to meaningful work.

University of Helsinki's
[DevOps with Docker, Fall 2026](https://courses.mooc.fi/org/uh-cs/courses/devops-with-docker-fall-2026)
informed module 07's reading-list application and documentation-reading tasks.
Our fixtures and explanations are original; the [references](web/references.md)
identify the source and its license.

## License

<!-- TBD: e.g. CC-BY-4.0 for text, MIT for code. -->
