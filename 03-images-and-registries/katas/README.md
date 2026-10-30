# A local image handover

A colleague wants to try your status page and has a compatible Linux
Docker environment. They've asked you for a file they can load, along
with enough instructions to get the service running. Prepare that
handover so they can follow it from a fresh terminal, including what
you tested and which results they should expect.

Choose a use for the page and a message that fits its audience, then
prepare the archive using the existing Python image, an unused tag of
your own and a new archive path. Keep the exercise local and use the
application unchanged, working from `01-why-containers/first-app` when
you launch it. You have everything you need from the core chapters.

## The handover must work locally first

Plan your own sequence using the chapters as a reference. Your result must
satisfy these conditions:

- The new tag points to the same full local image ID as your chosen Python image.
- An archive restores that tag after you remove only the extra reference.
- The restored image's full ID and platform match what you recorded.
- A container named `ark-artifact-service`, on a free loopback port of your
  choice, uses the restored image without pulling and returns your message
  and a successful `/health`.
- Its `.Image` value matches the image ID in your notes.

Before saving, predict where `app.py`, the chosen message and a note
previously written inside a container will be after restoration. Use
the image as it stands and include your reasoning in the handover,
so your colleague understands which inputs the launch command supplies.

## Leave enough information for another person

Write the procedure for your chosen shell, including the archive's filename,
tag, full image ID, tested platform and the source file to place alongside
it. Describe how to launch the service and check the result, and link the
[paired launch reference](../04-transfer-an-image-locally.md#use-the-restored-image-for-our-service)
for someone using the other shell. If their CPU architecture differs,
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
<summary>The archive loads, but the service can't find app.py</summary>

Follow the mount's source path back to your host and check that `app.py`
is there. The archive supplies the Python image, while the launch command
still needs to make that host file available inside the container.

</details>

When you've finished checking the handover, clean up the resources you
created: stop and remove `ark-artifact-service`, remove your extra tag,
then delete your exact archive file and its empty directory if you no
longer need them. Leave the original Python reference, source files and
other containers in place so the rest of your work remains available.
