---
title: "Find the image behind the container"
track: runbook
---

# Find the image behind the container

Suppose a colleague sees your message service and asks to try it on their
computer. You have `app.py` ready to send, and you know that the launch command
uses `python:3.12-alpine`. Before putting together the handover, though, it's
worth finding out exactly what Docker has been supplying each time you
created a container.

We've already seen part of the answer in module 02: every replacement started
with Python available because Docker could reuse an image stored on your
computer. We'll follow that image through this module, give it a name for
our handover and save it to an archive. By the time we're done, you'll be
able to explain what your colleague receives and which other pieces they
need to run the service.

## Find what Docker already has

Keep using the Docker setup from module 02, with Linux containers and the
Python image downloaded for the first service. That gives us everything we
need for the required exercises, so you can work locally throughout the
module. Let's start in your host terminal by asking Docker which Python
images it has:

```text
docker image ls python
```

Find the row for `3.12-alpine` and look at the repository, tag and `IMAGE ID`
columns. The first two let you recognize the image by name, while the ID
gives us a way to compare its content later. This row remains available
when you stop the service, which is why Docker can use the same image to
create the next container. If the row is missing, restore the Python image
from the earlier setup before continuing.

If you still have `ark-ops` from module 02, we can also ask that container
which image it was created from:

```text
docker inspect --format '{{.Image}}' ark-ops
```

The value includes a `sha256:` prefix and is longer than the ID shown in
the image listing, where Docker uses a shortened form to keep the table
readable. To get the full value for the named image, use the next command;
you can also start here if you already removed `ark-ops`:

```text
docker image inspect --format '{{.Id}}' python:3.12-alpine
```

When both the container and image are available, compare their full values.
They should match if the tag still refers to the image used at creation.
If someone has pulled a newer image under that tag in the meantime, the
container keeps its original image, so the two values can differ. This is
one reason we'll record an ID alongside the readable name in our handover.

## Run a job from the local image

Let's use the short job from module 02 to check the Python installation
provided by this image. This time we'll also tell Docker to use only the
image already available on this engine:

```text
docker run --rm --pull never python:3.12-alpine python --version
```

With `--pull never`, Docker reports an error if the requested image is
missing locally. When it is available, Python prints its version and `--rm`
removes the container after the job finishes, leaving the image ready for
another run.

Keep that Python version and the full image ID in your notes. Together they
tell us which Python release we ran and which image supplied it, including
the supporting files around Python. We'll use the ID again after
[giving the same image another tag](02-one-image-several-names.md).
