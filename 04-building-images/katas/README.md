---
title: "A build you can hand over"
track: kata
pagination_prev: 04-building-images/06-what-buildkit-does
---

# A build you can hand over

A colleague wants to deploy your service, but their deployment directory
will contain only an image archive and your instructions. They don't have
the course checkout, and installing Python packages on the receiving machine
isn't part of the arrangement. Prepare a package you can explain and test
before passing it along.

Use the supplied [template service](../template-service/README.md), or a
recipe you wrote yourself for the message service. You may choose your own
small HTTP application if you can define equivalent message and health checks;
using the supplied code keeps application programming out of the task.

## Before you start

You need Docker running Linux containers, Linux Bash or PowerShell 7, and
an internet connection for the Python base image and packages; Linux Engine
may require `sudo` for Docker. Nothing from the module's chapters needs to be
running. Check `docker ps -a` for a container already named
`ark-build-handover`. Docker reports a bind error if your chosen loopback
port can't be published; if that happens, use another host port in the launch
command and update the URL. Pick image tags you haven't used, such as
`ark-build:baseline` and `ark-build:improved`.

Work on a copy of `template-service`, so the supplied originals stay intact.
From the [course checkout root](../../before-you-start.md#get-the-course-files), this creates one beside the original; choose
another name if `my-template-service` already exists:

=== "Linux (Bash)"

    ```bash
    cp -r 04-building-images/template-service 04-building-images/my-template-service
    cd 04-building-images/my-template-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Copy-Item -Recurse .\04-building-images\template-service .\04-building-images\my-template-service
    Set-Location .\04-building-images\my-template-service
    ```

The copy includes the hidden `.dockerignore`, which allows only the recipes,
requirement files and the two Python sources into the build context.

## Set a receiving constraint

Choose an audience for the service and one requirement that changes the
packaging or deployment work. For example, the receiver may have no internet
access, or may require application files under `/service` instead of `/app`.
Write down why that choice fits the receiver and how you'll verify it.
Make the constraint observable through the files or deployment procedure,
so the task asks for a packaging decision beyond choosing a message.

Before opening a chapter, predict what rebuilding, restarting and replacing
would each do after a source edit. Also recall what happens to a container's
`/tmp` note when you replace it. Keep those answers beside the evidence you
collect rather than turning them into a Dockerfile change.

## Improve the supplied build

Work in your copy of `template-service`. Start with `Dockerfile.baseline` and keep
it available for comparison. Give your output images unused tags and keep
the same target platform and base resolution for both builds.

Your improved recipe must satisfy all of these conditions:

- It returns the chosen `AUDIENCE` message, lets `MESSAGE` override it, and
  returns a successful `/health`.
- Its default user is `ark`, its code remains root-owned and unwritable by
  that user, and the Jinja2 template produces the chosen message.
- It runs without a source mount.
- After one initial build of each recipe, an edit to `serve.py` reruns the
  baseline dependency installation but leaves the improved recipe's
  dependency steps cached.
- You record elapsed rebuild times for the same application-only edit,
  alongside the build output showing which steps ran. Report the observed
  timings even if background activity masks an improvement; the cached
  steps are the acceptance criterion, rather than a fixed number of seconds.

The [dependency chapter](../05-dependencies-and-build-cache.md)
shows which build output to compare. The task is to verify the cache boundary:
the baseline reruns dependency installation after a source edit, while the
improved recipe can reuse it. If you choose a different application for the
handover, still complete this supplied comparison as the bounded practice.

<details>
<summary>The dependency step runs after every code edit</summary>

Draw an arrow from each `COPY` to the steps that depend on its result.
Which inputs actually determine the package installation? Move those inputs
before the installation and leave frequently edited application files later.

</details>

## Prove the artifact can travel

Use your improved recipe or adapt your own service to the receiving constraint.
Your handover must include:

- The recipe and context exclusions needed to build, kept separately from
  the receiver's deployment directory.
- A local archive of the tested output, its tag, full local image ID and
  platform.
- A container named `ark-build-handover` launched from an empty deployment
  directory without pulling, building, mounting source or installing packages.
- The chosen message and health responses, no mounts, the expected
  application user, and a container `.Image` matching the recorded local ID.
- A check for your receiving constraint, such as successful startup with
  `--pull never` and no package downloads, or the required code path.

Plan the archive save/remove/load sequence yourself. Check that the archive
exists before removing a tag, and remove any containers using that image
first. Local restoration proves this sequence on your engine; leave actual
execution on a colleague's hardware as a separate validation unless you've
performed it.

<details>
<summary>Which commands move an image through a file?</summary>

`docker image save --output <file>.tar <image:tag>` writes an image's layers,
configuration and tag into an archive, and `docker image load --input <file>.tar`
restores them. `docker image inspect --format '{{.Id}}' <image:tag>` and
`--format '{{.Os}}/{{.Architecture}}'` give you the identity and platform to
record before saving and compare after loading. `docker image rm <image:tag>`
refuses to remove a tag while a container still uses the image, and
`docker run --pull never` fails instead of downloading a missing image.
The [archive handover in module 03](../../03-images-and-registries/04-transfer-an-image-locally.md)
walks through the same sequence for the course image.

</details>

Explain why the tested archive is a stronger delivery promise than asking the
receiver to rebuild a moving recipe. Include its runtime configuration and
a loopback-only launch command for your chosen shell, with a link to the
[paired launch reference](../01-package-the-service-in-an-image.md#run-your-build)
for the other shell.

<details>
<summary>The image loads, but the service still expects a file from your laptop</summary>

Compare the container's mounts and start command with the image's copied
files. Check whether a source path or dependency installation has survived
in your deployment procedure. The receiver should need the archive and
runtime settings, while the build inputs stay with the build environment.

</details>

## Transfer the recipe to another application

If you chose an application of your own, explain how its runtime, dependency
inputs and start command changed the guided recipe. Otherwise, make the
same transfer in writing using the supplied
[Node.js service](../language-transfer/README.md). Its code and runtime choices
are provided so learning another programming language isn't a prerequisite.

Identify the base image, source files, application user, dependency step
if needed, default command and context exclusions. Explain which checks
still apply unchanged. An explanation is enough for this second language;
building and running it is an optional additional test, separate from the
required archive handover you already completed.

## Review the trade-off and reset

Ask a peer to follow the handover, or use a fresh terminal yourself without
the build directory as the working directory. Have the reviewer choose one
question: why this user, why these copied files, or why this dependency boundary?
Answer using an observation from your run.

Record one remaining risk, such as an untested platform, a base image tag
that can move, or incomplete shutdown handling. Your handover should make the
remaining limits just as clear.

Stop and remove `ark-build-handover`, remove only your exercise tags after
checking their containers, and delete your exact archive and empty deployment
directory if you no longer need them. Keep your recipes, measurements and
the supplied source files; don't prune shared images, builder caches or
another exercise's resources.

Before you leave, choose one build input and predict the first step that would
need to rerun after it changes. Check that prediction against the build output:
the cache report shows which earlier work Docker could reuse.
