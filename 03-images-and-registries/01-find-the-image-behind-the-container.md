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

Python was already there each time because Docker could reuse an image
stored on your computer.
We'll follow that image through this module, give it a name for our
handover and save it to an archive. By the time we're done, you'll be able
to explain what your colleague receives and which other pieces they need
to run the service.

## Find what Docker already has

Start in the module's `first-app` directory, which holds the source we'll use
when we run the restored image later. From the course checkout root, move there:

=== "Linux (Bash)"

    ```bash
    cd 03-images-and-registries/first-app
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\03-images-and-registries\first-app
    ```

Now ask Docker which Python images it has:

```text
docker image ls python
```

Find the row for `python:3.12-alpine` and look at its name and ID. Recent
Docker versions show the repository and tag together in an `IMAGE` column,
while older ones split them into `REPOSITORY` and `TAG`. The name lets you
recognize the image, while the ID gives us a way to compare its content later. This row remains available
when you stop and remove a service, which is why Docker can use the same
image to create the next container. If the row is missing, download the
image from Docker Hub with `docker pull python:3.12-alpine` and list it again.

The ID in the listing is shortened to keep the table readable. To get the
full value for the named image, ask Docker to inspect it:

```text
docker image inspect --format '{{.Id}}' python:3.12-alpine
```

The value includes a `sha256:` prefix and is longer than the one in the
listing. Keep it in your notes, because we're about to compare it with
what a container reports.

## Run a job from the local image

Let's run a short job to check the Python installation provided by this
image. We'll tell Docker to use only the image already available on this
engine, and give the container a name so that we can question it after
the job finishes. Check that `ark-runtime-check` is free before using it:

```text
docker run --name ark-runtime-check --pull never python:3.12-alpine python --version
```

With `--pull never`, Docker reports an error if the requested image is
missing locally. When it is available, Python prints its version and the
process exits, leaving a stopped container behind. That container still
remembers which image it was created from:

```text
docker inspect --format '{{.Image}}' ark-runtime-check
```

Compare this value with the full image ID you recorded. They should match
because the tag still refers to the image used at creation. If someone
pulled a newer image under that tag later, existing containers would keep
their original image, so the two values could differ. This is one reason
we'll record an ID alongside the readable name in our handover.

Remove the stopped container now. For a job you don't need to inspect,
`--rm` removes it as soon as the process finishes:

```text
docker rm ark-runtime-check
```

Keep the Python version and full image ID in your notes. Together they identify
the release and the image that supplied Python and its supporting files. We'll
use the ID again after [giving the image another tag](02-one-image-several-names.md).
