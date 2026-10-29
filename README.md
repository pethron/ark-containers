# ARK: Containers

A complete course on Linux containers, covering both **Docker** and **containerd**.

## Website preview

The [public preview](https://pethron.github.io/ark-containers/) currently contains
the first module. It is work in progress, not the completed course.

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
| **A** | **Architecture** — *Deep Dive* | You want to understand what happens under the hood | Kernel namespaces, cgroups, OverlayFS, networking internals, OCI. No shortcuts. |
| **R** | **Runbook** — *Fast Track* | You already work with it, or you are in a hurry | Clean syntax, commented CLI flags, minimal ready-to-use configs. |
| **K** | **Katas** — *Hands-On* | You learn by doing | Exercises of increasing difficulty: broken setups to fix, apps to containerize. |

These are complementary views, not an obligatory A → R → K sequence. The guided
path starts with a small working application, then returns to its mechanisms,
trade-offs and harder variations. Each module's README connects the chapters
and marks their tracks; reference readers can still go directly to the material
they need.

Expect to predict outcomes, make controlled mistakes, inspect evidence, and adapt
examples to a changed requirement. Technical depth remains part of the course,
but is not an admission requirement for the first useful result.

## Modules

Start with **module 01**, including the supplied application in its third
chapter.

The draft guided route is **01 → 04 → 05 → 06 → 07 → 08 → 09 → 02 → 03 →
10 → 11**: use and deliver a working system, then reconstruct its mechanisms,
then harden and operate it. The existing numbers identify topics, not a required
reading order.

You can also choose the next question:

- **How does it work underneath?** Continue with modules 02–03, using the
  application experience as context.
- **How do I do more with it?** Continue with module 04, then images, builds,
  storage, networking and Compose; then return to modules 02–03 for the mechanisms
  before security and production.

Module numbers group topics; they do not require completing every Architecture
chapter before doing practical work. Later module content is still being
developed; its exercises will revisit earlier ideas with less guidance.

| # | Module |
|---|--------|
| 01 | [Why containers](01-why-containers/) |
| 02 | [Linux primitives](02-linux-primitives/) |
| 03 | [Runtime architecture](03-runtime-architecture/) |
| 04 | [Running containers](04-running-containers/) |
| 05 | [Images and registries](05-images-and-registries/) |
| 06 | [Building images](06-building-images/) |
| 07 | [Storage](07-storage/) |
| 08 | [Networking](08-networking/) |
| 09 | [Compose](09-compose/) |
| 10 | [Security](10-security/) |
| 11 | [Production and troubleshooting](11-production-and-troubleshooting/) |

## Layout

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
