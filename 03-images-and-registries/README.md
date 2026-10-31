# 03: Images and registries

So far the service has started from a single name, `ghcr.io/pethron/ark-message:1`,
and Docker downloaded the image behind it the first time you used it. Now a
colleague wants to run the service on a lab computer that can't reach the
internet. If you could bring them only one file, what would it have to contain?
Try to answer before reading on, because that question drives the whole module.

We'll follow the image behind the running container, look at the names it can
carry and what it actually contains, then hand it over locally through an
archive. When the archive comes back into Docker, we'll check that it's the
same image and that it suits the receiving machine, and only then run the
familiar service from it.

Along the way we'll talk about registries: what they add to a handover, and
when copying an archive is perfectly fine. You won't need a cloud account or
the course files; the course image and a directory where you can create a file
are enough.
