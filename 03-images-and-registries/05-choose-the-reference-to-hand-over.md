---
title: "Manifests, digests and platforms"
track: architecture
---

# Manifests, digests and platforms

Your colleague can now receive an archive that you've loaded and used to
run the service. What would you write in the accompanying message? They
will need to know which image you tested, whether it suits their computer
and which settings to use when they start it, so let's use the results of our
experiment to answer those questions.

## Names help people, identity helps comparisons

Start with the tag and full local image ID you recorded. The tag gives
your colleague a convenient name to use in commands, and the ID lets them
compare their loaded image with the one you tested. Keeping both is useful
because a tag can be reassigned to another image over time, while a content
identifier is calculated from the object it describes.

You'll meet the same idea when retrieving images from a registry, where
a reference such as `repository@sha256:...` uses a **digest** to select
particular content. Registry distribution involves several objects, so
its digests and the local image ID may describe different things even
though they use the same `sha256:` prefix. For our archive, use the local
ID comparison we've already tested.

## Check the receiving platform

Next, include the operating system and CPU architecture from your inspection
output. Our examples use Linux containers, and a value such as `linux/amd64`
tells your colleague which platform this image targets. If their computer
uses an arm64 processor, they'll need a compatible build or an environment
with suitable emulation before they can run it.

Publishers can make several platform builds available under one tag, letting
Docker select the appropriate build during a pull. The course image is
published that way, for `linux/amd64` and `linux/arm64`. Our archive contains
the image we saved locally, so
the receiving environment needs to support that build, including its operating
system requirements. For this handover,
record the platform you've actually tested and leave testing on a different
machine as an explicit next step.

## Follow the registry's index

With internet access, inspect the published reference:

```text
docker buildx imagetools inspect ghcr.io/pethron/ark-message:1
```

Look for the index digest near the top, then the separate manifest entries for
`linux/amd64` and `linux/arm64`. The index is a list of descriptors: a pull
can select the manifest for the intended platform, whose configuration and
layers describe that particular image. Other entries may show
`unknown/unknown` for attestations; don't treat those as runnable platforms.

Compare the platform you recorded from `docker image inspect` with the
appropriate entry. The index and platform manifests are different registry
objects. A local image ID depends on the engine's image store, so don't assume
it matches or differs from a particular registry digest: identify what each
value describes before comparing them. A digest identifies content, not
whether that content is safe or correctly configured. A tag can move to a
new index; a digest identifies a particular object.

If your Linux Docker installation doesn't include the Buildx plugin,
`docker manifest inspect ghcr.io/pethron/ark-message:1` shows the registry's
index as JSON instead. Find the `platform` and `digest` fields in its
`manifests` list. A network or access error means you haven't verified the
registry yet; the local archive comparison remains valid.

## Where a registry fits

Passing an archive works well for this exercise, but you can imagine the
extra work if every colleague needs a copy each time an image changes.
A **registry** provides a shared place to store and distribute images:
you publish content with `push`, and others retrieve it with `pull`.
GitHub's container registry is one of them: it's where Docker downloaded our
course image the first time you ran the service.

The destination is part of the image reference, which is why ours begins with
`ghcr.io`. When a reference has no registry address, Docker uses Docker Hub,
the default registry. The official Python image our service is built on is
usually written `python:3.12-alpine`; in full it's
`docker.io/library/python:3.12-alpine`, which includes Docker Hub's address
and the `library` namespace reserved for official images. Our local
`ark-message:handover` has no address either, so if you ever tried to push it,
Docker would assume Docker Hub too.

Keep the archive and handover tag for one more question:
[how does the registry deliver that content?](06-how-a-registry-serves-an-image.md)
