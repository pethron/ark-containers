# 04: Building images

So far our message service has started from the Python image with `app.py`
mounted from your computer, so anyone receiving it also needed the source
file beside the launch command. In this module we'll package the code into
an image of our own, so the receiving machine needs only the image and its
launch settings.

We'll start by building and running a supplied recipe, checking the service's
response, the account that runs it and the files that account can change.
From there we'll look at how the build uses your files and earlier work,
write the service's own Dockerfile, and add a dependency without reinstalling
it after every application edit.

## What you will learn

- Build an image from a Dockerfile and run the service without mounting its code
- Choose an application user with `USER` and explain the file permissions it needs
- Explain the build context, `COPY`, layers and when the build cache is reused
- Write a Dockerfile and a `.dockerignore` for the service
- Explain `RUN`, `CMD`, `ENTRYPOINT` and how stop signals reach the application
- Add a dependency without rerunning its installation after every source edit

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Package the service in an image](01-package-the-service-in-an-image.md) | R |
| 02 | [Build cache and build context](02-build-cache-and-build-context.md) | A |
| 03 | [Write the service's Dockerfile](03-write-the-services-dockerfile.md) | R |
| 04 | [Commands, entrypoints and stop signals](04-commands-and-signals.md) | A |
| 05 | [Add a dependency without rebuilding it every time](05-dependencies-and-build-cache.md) | R |

We'll use the [packaged service](message-service/README.md) and the
[template service](template-service/README.md), which adds a dependency to
the same application. Keep their complete directories when you clone the
course, including the hidden `.dockerignore` files.

Finish with [a build you can hand over](katas/README.md), where you keep
dependency installation cached after a source edit and deliver the result
as an archive to an empty deployment directory.

## Optional paths

The [image builds deep dive](../advanced/image-builds/README.md) covers
multi-stage builds, BuildKit cache mounts, reproducible build inputs
and multi-platform builds.

From memory, explain why restarting a container can't
deploy a source edit, and which step of your recipe a dependency change
would rebuild first.

Next: [Storage](../05-storage/README.md).
