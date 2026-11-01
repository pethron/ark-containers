---
pagination_next: 03-images-and-registries/01-find-the-image-behind-the-container
---

# 03: Images and registries

So far the service has started from a single name, `ghcr.io/pethron/ark-message:1`,
and Docker downloaded the image behind it the first time you used it. Now a
colleague wants to run the service on a lab computer that can't reach the
internet. If you could bring them only one file, what would it have to contain?
Try to answer before reading on, because that question drives the whole module.

We'll follow the image behind the running container, give it a handover name
and save it to an archive. When the archive comes back into Docker, we'll
check that it's the same image and run the familiar service from it.

With that handover working, we'll open the archive to follow its layers and
configuration, then look at the platforms and content a registry serves.
You won't need a cloud account or the course files. The registry inspection
does need internet access; the local archive exercise works with the image
already on your engine.
