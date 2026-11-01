---
pagination_next: 04-building-images/01-package-the-service-in-an-image
---

# 04: Building images

So far the message service has arrived ready-made: you pulled
`ghcr.io/pethron/ark-message:1`, ran it, looked inside it and handed it over
as an archive. Somebody wrote the recipe that put Python, the code, a user and
a start command into that image, and this module is where you take over that
job.

We'll begin by building the recipe the course uses to publish the image and
checking the result from the outside: the service's response, the account that
runs it and the files that account is allowed to change. Then we'll compare
your build with the image you've been using.

With a working image in hand, we'll look at how the build uses your files and
the work it has already done, then write the service's Dockerfile ourselves.
We'll add a dependency without reinstalling it after every small edit, then
see how the startup command and stop signals reach the application. Finally,
we'll follow the builder through stages, caches and platform-specific outputs
using the same service.

The module's services live in its own directories, and each includes a hidden
`.dockerignore` file. Keep those directories complete when you clone or copy
the course, since the build depends on what they leave out as much as on
what they include.

With an image you can explain and test, you can also hand it over through
a registry rather than an archive. The optional publication runbook puts it on
Docker Hub, under an account in your own namespace; it changes the transport,
while the application's contract and the account-free requirements of the kata
stay the same.
