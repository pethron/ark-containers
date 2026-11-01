---
title: "A local image handover"
track: kata
pagination_prev: 03-images-and-registries/06-how-a-registry-serves-an-image
---

# A local image handover

A colleague wants to try your status page on a machine with a compatible
Linux Docker environment but no internet access. They've asked you for a file
they can load, along
with enough instructions to get the service running. Prepare that
handover so they can follow it from a fresh terminal, including what
you tested and which results they should expect.

Choose a use for the page and a message that fits its audience, then
prepare the archive using the course image, an unused tag of your own and a
new archive path. Keep the exercise local and use the
application unchanged. You have everything you need from the core chapters.

## Your starting point

Work from a fresh terminal opened in a directory where you can create files.
Check that tag `1` appears in `docker image ls ghcr.io/pethron/ark-message`;
if it doesn't, download it with `docker pull ghcr.io/pethron/ark-message:1`.
Before
choosing your tag and archive path, check `docker image ls`,
`docker ps -a` and the directory listing so that you don't overwrite
someone else's work. The container name `ark-artifact-service` and local port 8080 must be free.

## The handover must work locally first

Plan your own sequence using the chapters as a reference. Your result must
satisfy these conditions:

- The new tag points to the same full local image ID as the course image.
- An archive restores that tag after you remove only the extra reference.
- The restored image's full ID and platform match what you recorded.
- A container named `ark-artifact-service`, published on `127.0.0.1:8080`,
  uses the restored image without pulling and returns your message
  and a successful `/health`.
- Its `.Image` value matches the image ID in your notes.

Before saving, predict where `app.py`, the chosen message and a note
previously written inside a container will be after restoration. Use
the image as it stands and include your reasoning in the handover,
so your colleague understands which inputs the image carries and which the
launch command supplies.

## Leave enough information for another person

Write the procedure for your chosen shell, including the archive's filename,
tag, full image ID and tested platform. Describe how to launch the service and
check the result; a launch command written on one line works in both Bash and
PowerShell. If their CPU architecture differs,
explain what they should check before launching; you can leave setting
up emulation outside this exercise.

Include the environment where you performed the test. On your own engine,
Docker may have reused cached layers, so describe the result as a local
restoration check and leave testing on another machine as a separate step.
Then ask someone to follow the notes, or try them yourself from a fresh
terminal to see whether you've left out a step.

<details>
<summary>The tag has a different name, but the ID didn't change</summary>

Compare how you created the new tag with how you created a container.
Tagging adds a reference to existing image content, so both names should
lead back to the same full ID.

</details>

<details>
<summary>The archive loads, but Docker says the image is missing</summary>

With `--pull never`, Docker won't fall back to a registry, so the reference in
your launch command must match the tag the archive restored, character for
character. Compare it with `docker image ls` before suspecting the archive.

</details>

When you've finished checking the handover, clean up the resources you
created: stop and remove `ark-artifact-service`, remove your extra tag,
then delete your exact archive file and its empty directory if you no
longer need them. Leave the course image and other containers in place so the rest of your work remains available.
