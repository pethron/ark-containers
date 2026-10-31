---
title: "Reproducible build inputs"
track: architecture
---

# Reproducible build inputs

Imagine sending the template service's recipe to a colleague who builds it
next month. Some of its package versions are pinned, but many other inputs
can change between builds. Let's list those inputs and decide what
reproducible should mean for this handover.

Use Linux Bash or PowerShell 7 with Linux containers and an internet
connection. Linux Engine may require `sudo` for Docker. From the
[course checkout root](../../before-you-start.md#get-the-course-files):

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/template-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\template-service
    ```

## What the pins leave open

The core recipe pins Jinja2, but the `python:3.12-alpine` tag and Alpine's
package repository can change between builds. Its transitive dependencies
are resolved by pip from the versions available at build time. The advanced
compiled-dependency fixture pins Jinja2 and MarkupSafe, but still obtains
the tools used to build MarkupSafe from the package repository. Network
services, the toolchain, timestamps and the target platform can all affect
the result.

Cache reuse can hide that movement. Chapter 02 of the core module noted that
a cached `RUN pip install` is reused without checking the package repository.
You can ask for fresh resolution:

```text
docker build --pull --no-cache -t ark-template:fresh .
```

`--pull` asks the registry for the current content behind the base tag, and
`--no-cache` reruns every operation of the recipe. Together they are useful
for a freshness check, but a moving upstream can supply different content
on the next attempt.

## Fix the base by digest

For a controlled advanced build, record the digest behind the base reference:

```text
docker buildx imagetools inspect python:3.12-alpine
```

The top-level digest may identify a multi-platform index, with separate
platform manifests below it. To fix the base content, replace the `FROM`
reference with `python@` followed by the recorded digest, and note the target
platform alongside it. The multi-stage recipe has two stages built from the same base,
so pin both consistently. This digest identifies a registry object; it isn't
interchangeable with our final image's local configuration ID.

The remaining inputs need their own controls: dependency locks with hashes,
versions of the build tools, and anything else fetched during the build.
`ARG` is useful for non-secret build parameters, and `ENV` records
environment defaults for later instructions and containers. Neither
mechanism freezes a package repository. A non-secret release number can
label an image, but it doesn't establish which files the image contains.

## Levels of assurance

A recipe with controlled inputs improves repeatability. Byte-for-byte
reproduction is a stronger claim, which needs evidence from independent
builds under the declared constraints. For deploying the exact artifact you
tested, neither is necessary: retain and transfer that artifact by identity,
as the core module's kata does with its archive, instead of asking every
receiving machine to rebuild it.

## Make a build-input inventory

For the template service, list the base image, platform, requirements, build
tools, source files and runtime configuration. Mark which are fixed and which
can move. Explain to a peer which one you would control next and why, or write
the same argument for a solo review.

Remove the tag you built:

```text
docker image rm ark-template:fresh
```

Keep shared caches and base images. The official
[cache invalidation rules](https://docs.docker.com/build/cache/invalidation/)
describe exactly which inputs the builder compares, and the
[multi-platform builds](multi-platform-builds.md) chapter adds the target
platform to this inventory.
