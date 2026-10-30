---
title: "Choose the reference to hand over"
track: architecture
---

# Choose the reference to hand over

Your colleague can now receive an archive that you've loaded and used to
run the service. What would you write in the accompanying message? They
will need to know which image you tested, whether it suits their computer
and how to supply the application, so let's use the results of our
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
ID comparison we've already tested; the optional
[manifest deep dive](../advanced/images-and-distribution/digests-manifests-and-multi-arch-images.md)
follows those additional objects through a registry when you're ready
to explore distribution in more detail.

## Check the receiving platform

Next, include the operating system and CPU architecture from your inspection
output. Our examples use Linux containers, and a value such as `linux/amd64`
tells your colleague which platform this image targets. If their computer
uses an arm64 processor, they'll need a compatible build or an environment
with suitable emulation before they can run it.

Publishers can make several platform builds available under one tag, letting
Docker select the appropriate build during a pull. Our archive contains
the image we saved locally, so the receiving environment needs to support
that build, including its operating system requirements. For this handover,
record the platform you've actually tested and leave testing on a different
machine as an explicit next step.

## Where a registry fits

Passing an archive works well for this exercise, but you can imagine the
extra work if every colleague needs a copy each time an image changes.
A **registry** provides a shared place to store and distribute images:
you publish content with `push`, and others retrieve it with `pull`.
We already used one in module 01, when Docker Hub supplied the Python image.

The destination is part of the image reference. Written in full, our Python
reference is `docker.io/library/python:3.12-alpine`, which includes Docker
Hub's registry address and the `library` namespace. The short form uses
those defaults, while a reference for another registry includes that
registry's address.

Access depends on the repository's policy: a public repository may allow
anonymous pulls, while a private one can require authentication.
`docker login` gives the client credentials to present, and the registry
checks whether that account has permission for the requested repository
and action. You can try publication in the
[optional local registry lab](optional/run-a-local-registry.md), with no
external account required; the archive remains enough for the core exercise.

You now have the pieces for your colleague's handover: the archive, tag,
full local ID, tested platform, `app.py` and the launch command. Include
the chosen message setting in that command, since both it and the source
file were supplied when we created the container. Try putting those
pieces together yourself in the [local handover kata](katas/README.md),
then we'll simplify the package by
[building our own image](../04-building-images/README.md).

Keep the archive and extra tag if you want to try the optional publication
lab first. When you're finished, remove only `ark-runtime:handover`, your
exact archive file and its empty directory, leaving the original Python
image and other exercises in place. A global prune would affect work
outside this lab, so keep the cleanup limited to what you created here.
