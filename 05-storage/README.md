# 05: Storage

Before starting, predict what happens to a file a container wrote when you
replace that container with a new one. You saw the answer earlier with a small
note inside a running service; here it stops being a curiosity.

Our services have so far traveled as images we could replace at any moment.
That works beautifully while a service has nothing to remember. In this module
it starts keeping notes, and replacing the container must no longer cost us
those notes, whether we're deploying a new version or simply recreating it
with different settings.

We'll lose the notes first, on purpose, by replacing the container that wrote
them. Then we'll keep them in a volume that outlives every container, and look
at where a container's files actually live. That picture helps when choosing
between volumes, bind mounts and tmpfs for different needs. We'll finish by
backing up the notes and restoring them into a working service, since the
restore is the part that proves the backup is worth keeping.

The notes service is supplied in this module's directory, including a hidden
`.dockerignore`, so keep the directory complete when you clone the course.
