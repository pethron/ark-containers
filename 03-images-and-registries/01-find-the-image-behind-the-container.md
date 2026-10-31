---
title: "Finding and running local images"
track: runbook
---

# Finding and running local images

Suppose a colleague sees your message service and asks to try it on a lab
computer that can't reach the internet. They can't download the image the way
your Docker did, so you'll have to bring it to them. Before putting together
that handover, though, it's worth finding out exactly what Docker has been
supplying each time you created a container.

The download happened only once because Docker keeps the images it uses on your
computer and reuses them for every new container. We'll follow that stored image
through this module, give it a name for our handover and save it to an archive.
By the time we're done, you'll be able to explain what your colleague receives
and which other pieces they need to run the service.

## Find what Docker already has

You need a working Docker setup running Linux containers; this chapter doesn't
use the course files. Ask Docker which images of our service it stores:

```text
docker image ls ghcr.io/pethron/ark-message
```

Find the row for tag `1` and look at its name and ID. Recent Docker versions
show the repository and tag together in an `IMAGE` column, while older ones
split them into `REPOSITORY` and `TAG`. The name lets you recognize the image,
while the ID gives us a way to compare its content later. This row remains
available when you stop and remove a service, which is why Docker can use the
same image to create the next container. If the row is missing, download the
image with `docker pull ghcr.io/pethron/ark-message:1` and list it again.

The ID in the listing is shortened to keep the table readable. To get the
full value for the named image, ask Docker to inspect it:

```text
docker image inspect --format '{{.Id}}' ghcr.io/pethron/ark-message:1
```

The value includes a `sha256:` prefix and is longer than the one in the
listing. Keep it in your notes, because we're about to compare it with
what a container reports.

## Run a job from the local image

Let's run a short job to check the Python installation the image provides.
We'll tell Docker to use only the image already available on this engine, and
give the container a name so that we can question it after the job finishes.
Check that `ark-image-check` is free before using it:

```text
docker run --name ark-image-check --pull never ghcr.io/pethron/ark-message:1 python --version
```

With `--pull never`, Docker reports an error if the requested image is
missing locally, which is exactly the situation your colleague's offline
machine will be in. When it is available, the words after the image name
replace the server with `python --version`: Python prints its version and the
process exits, leaving a stopped container behind. That container still
remembers which image it was created from:

```text
docker inspect --format '{{.Image}}' ark-image-check
```

Compare this value with the full image ID you recorded. They should match
because the tag still refers to the image used at creation. If someone
pulled a newer image under that tag later, existing containers would keep
their original image, so the two values could differ. This is one reason
we'll record an ID alongside the readable name in our handover.

Remove the stopped container now. For a job you don't need to inspect,
`--rm` removes it as soon as the process finishes:

```text
docker rm ark-image-check
```

Keep the Python version and full image ID in your notes. Together they identify
the release and the image that supplied our service. We'll use the ID again
after [giving the image another tag](02-one-image-several-names.md).
