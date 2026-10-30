---
title: "What an image contains"
track: architecture
---

# What an image contains

Before saving `ark-runtime:handover`, let's go back to how our service
starts. Python and its supporting files come from the image, while
`app.py` lives on your computer and becomes available inside the container
through the mount. We have been bringing those two inputs together at
launch, and our handover needs to account for both.

Along with its files, an image carries **configuration defaults** for the
containers created from it, such as a command, a working directory or a user.
Our launch command supplies `python /app/app.py` after the image name,
overriding the image's default command for that instance. This lets us use
a general-purpose Python image to run our particular application.

## Files arrive in layers

The files in an image are assembled through a sequence of filesystem
changes called **layers**. Each layer builds on the result of the previous
ones, adding, changing or removing files from the view that a new container
will receive. Related images can share layers, which allows Docker to reuse
content it already stores when another image needs it.

We can get a first look at how our Python image was assembled by asking
for its history:

```text
docker image history ark-runtime:handover
```

Read through a few entries and look at the kinds of changes they describe.
You'll find both steps that add filesystem content and steps that record
configuration, which is why the history can have more entries than file
layers. We'll return to this output when we write a Dockerfile in module 04
and can connect our own instructions to the resulting image.

There is one consequence worth keeping in mind already: a later layer can
hide a file whose bytes remain in an earlier layer. If that file contains
a password or a private key, anyone receiving those layers may still be
able to recover it. Keep secrets out of the image from the beginning,
including intermediate steps.

## The container's files are a different lifetime

Remember `/tmp/ark-note` from module 02? It survived a stop/start because
Docker kept that container's writable filesystem, including the note.
When we created a replacement, Docker gave it a fresh writable filesystem
on top of the same image, so we saw the original starting files again.
Changes made during the first container's life stayed with that container.

We can now account for the three sources of files in our experiment:
the image supplies Python, the host mount supplies `app.py`, and the
container's writable filesystem holds the note. Saving the image will
capture the first of those, along with its configuration. Our colleague
will still need the source file and the launch settings to bring the
service together.

That's enough to predict what we'll recover in the
[local archive exercise](04-transfer-an-image-locally.md). If you'd also
like to see how Docker implements the filesystem view, the optional
[layer deep dive](../advanced/images-and-distribution/image-content-and-writable-layers.md)
follows writes through copy-up and explains the different layer identifiers;
you can explore that mechanism whenever you're curious about it.
