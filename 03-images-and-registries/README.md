# 03: Images and registries

Your message service is running, and a colleague would like to try it too.
What should you send them? So far, we've brought together an image that
supplies Python and a file on your computer that supplies the application.
Let's follow the image through a local handover so we can explain what
it gives our colleague and what they need alongside it.

We'll use the image already downloaded for the first service, inspect it,
give it a handover name and save it to an archive. After loading that archive
back into Docker, we'll run the familiar service and compare the results.
You can complete the whole path locally; publication is an optional next
experiment, and building an image containing our code comes in module 04.

## What you will learn

- Find the image used by a container
- Read repository names and tags and find the publisher's versioning conventions
- Explain how image files, defaults and layers provide a container's starting point
- Save and load an image locally, checking identity and platform
- Explain when a registry is useful for distributing images

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Find the image behind the container](01-find-the-image-behind-the-container.md) | R |
| 02 | [One image, several names](02-one-image-several-names.md) | R |
| 03 | [What an image contains](03-what-an-image-contains.md) | A |
| 04 | [Transfer an image locally](04-transfer-an-image-locally.md) | R |
| 05 | [Choose the reference to hand over](05-choose-the-reference-to-hand-over.md) | A |

Finish with [a local image handover](katas/README.md), where you choose
the tag and message and prepare a procedure someone else can follow.
Your notes will include the image identity, the platform and the checks
you performed, giving the receiver a starting point for their own test.

## Optional paths

You can [publish to a temporary local registry](optional/run-a-local-registry.md)
without a cloud account. The separate
[image and distribution deep dives](../advanced/images-and-distribution/README.md)
cover versioning strategies, layer mechanics, manifests, authentication
and platform details. Choose whichever question interests you and return
to the core path when you're ready.

Before moving on, use your experiment to explain how the original and
handover tags relate, where the old container's note lived and how `app.py`
becomes available to the service. Those answers will help us decide what
to put in our own image in
[Building images](../04-building-images/README.md).
