# ARK: Containers

A course on Linux containers, using **Docker** throughout the main learning path.
We'll also explain the components underneath it, including containerd; using
containerd directly is reserved for optional advanced labs.

## Website preview

The [public preview](https://pethron.github.io/ark-containers/) currently contains
the first module. It is work in progress, not the completed course.

Module 01 has completed its first editorial review. Modules 02–03 and the
optional Under the hood deep dives remain drafts, with their labs and katas.
The local build includes all of them. Core modules 04–09 are in preparation. The live
preview changes only after an explicit manual publication.

The site uses Zensical and GitHub Pages from this repository only. Existing
chapter Markdown is staged automatically during the build; do not edit the
generated `.site-docs/` or `site/` directories.

```bash
uv run scripts/build_site.py
uv run --no-project python -m http.server 8000 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:8000/` for the local build. The build inserts and verifies
`noindex, nofollow` on every generated HTML page, including the error page.
This asks compliant crawlers not to index the preview; it is not privacy or
authentication. Use this build script rather than deploying raw Zensical output.

Publication is manual: run **Publish course preview** from GitHub Actions after
pushing reviewed changes. Pushes alone do not deploy. GitHub Pages must use
**GitHub Actions** as its source. Before a production launch, remove the preview
indexing policy intentionally and verify the resulting HTML.

## How the course is built: ARK

The course is a sequence of modules, and each module is a sequence of chapters. Every chapter belongs to one of three tracks, **ARK**:

| | Track | For whom | What you get |
|---|-------|----------|--------------|
| **A** | **Architecture** (*Deep Dive*) | You want to understand what happens under the hood | Kernel namespaces, cgroups, OverlayFS, networking internals, OCI. No shortcuts. |
| **R** | **Runbook** (*Fast Track*) | You already work with it, or you are in a hurry | Clean syntax, commented CLI flags, minimal ready-to-use configs. |
| **K** | **Katas** (*Hands-On*) | You learn by doing | Exercises of increasing difficulty: broken setups to fix, apps to containerize. |

These are complementary views, not an obligatory A → R → K sequence. The guided
path starts with a small working application, then returns to its mechanisms,
trade-offs and harder variations. Each module's README connects the chapters
and marks their tracks; reference readers can still go directly to the material
they need.

Expect to predict outcomes, make controlled mistakes, inspect evidence, and adapt
examples to a changed requirement. Technical depth remains part of the course,
but is not an admission requirement for the first useful result.

## Core course

Follow modules **01 → 09** in order: run a service, operate it, package and
connect it, then harden it and recover from incidents. Start with module 01,
including the supplied application in its third chapter.

The core includes the theory needed to explain observations and justify
decisions, not just commands to copy. You don't need the optional deep dives
to complete the course or its final project. Module 01 is reviewed; modules
02–03 and the optional deep dives are drafts. Core
modules 04–09 are still in preparation.

| # | Module |
|---|--------|
| 01 | [Why containers](01-why-containers/) |
| 02 | [Running containers](02-running-containers/) |
| 03 | [Images and registries](03-images-and-registries/) |
| 04 | [Building images](04-building-images/) |
| 05 | [Storage](05-storage/) |
| 06 | [Networking](06-networking/) |
| 07 | [Compose](07-compose/) |
| 08 | [Security](08-security/) |
| 09 | [Production and troubleshooting](09-production-and-troubleshooting/) |

## Under the hood: optional advanced deep dives

Want to understand how Linux and the runtime arrange those boundaries?
[Under the hood](advanced/README.md) connects advanced explanations and
experiments to the same application:

- [Linux primitives](advanced/linux-primitives/README.md): processes,
  namespaces, cgroups, credentials and filesystems.
- [Runtime architecture](advanced/runtime-architecture/README.md): Docker
  Engine, containerd, shims, OCI and the wider ecosystem.
- [Images and distribution](advanced/images-and-distribution/README.md):
  versioning conventions, layers, manifests, registries and platform compatibility.

These are not numbered steps in the core course. Open them when a mechanism
interests you, then return to the application with a prediction or observation
to check. Linux VM prerequisites apply only to the experiments that name them.

## Layout

Numbered directories contain the core course. Optional deep dives live under
`advanced/`, with the same chapter, image and kata layout:

```
NN-module/
├── README.md        objectives, chapter list with tracks, katas
├── 01-<chapter>.md  front matter: title, track (architecture | runbook)
├── 02-<chapter>.md
└── katas/
    └── kata-NN-<name>/
        ├── README.md   scenario and goal (track: kata)
        ├── starter/    work here
        └── solution/   try first, peek later
```
## Credits

The teaching approach is inspired by
[fast.ai's teaching philosophy](https://www.fast.ai/posts/2016-10-08-teaching-philosophy.html)
and its discussion of David Perkins's *Making Learning Whole*: start with a
manageable whole task, investigate its parts, and return to meaningful work.

## License

<!-- TBD: e.g. CC-BY-4.0 for text, MIT for code. -->
