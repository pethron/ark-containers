# ARK: Containers

A complete course on Linux containers, covering both **Docker** and **containerd**.

## How the course is built: ARK

The course is a sequence of modules, and each module is a sequence of chapters. Every chapter belongs to one of three tracks, **ARK**:

| | Track | For whom | What you get |
|---|-------|----------|--------------|
| **A** | **Architecture** — *Deep Dive* | You want to understand what happens under the hood | Kernel namespaces, cgroups, OverlayFS, networking internals, OCI. No shortcuts. |
| **R** | **Runbook** — *Fast Track* | You already work with it, or you are in a hurry | Clean syntax, commented CLI flags, minimal ready-to-use configs. |
| **K** | **Katas** — *Hands-On* | You learn by doing | Exercises of increasing difficulty: broken setups to fix, apps to containerize. |

Read everything in order, or follow only the track you need: each module's README marks the track of every chapter.

## Modules

Flow: **why → under the hood → use → build → connect → secure → operate**. Modules 01–03 are mostly Architecture; jump to 04 if you only need the Runbook.

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

<!-- List the sources this course drew inspiration from. -->

## License

<!-- TBD: e.g. CC-BY-4.0 for text, MIT for code. -->
