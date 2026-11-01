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
them. Then we'll keep them in a volume, compare it with bind mounts and tmpfs,
and restore a backup into a working service. With that result in hand, we'll
look at the writable layer and the mount visible to the process, so we can
explain where the notes went and why the service can write them.

The notes service is supplied in this module's directory, including a hidden
`.dockerignore`, so keep the directory complete when you clone the course.
