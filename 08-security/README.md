# 08: Security

By now the notes service runs from an image you built, keeps its data in a
volume and talks to its API over a network. Everything works, but would you
be comfortable exposing it? Each of those steps involved a choice you probably
accepted by default: which user the process runs as, which kernel features it
may call, what the build could read and where the base image came from.

This module will return to those defaults and ask what an attacker could do
with each one. We'll start from a threat model, so that every hardening step
answers a concrete risk, and then reduce what the container is allowed to do:
running without root, dropping capabilities, making the filesystem read-only
and filtering system calls. The same reasoning extends to the image itself,
because a container is only as trustworthy as the layers and credentials that
went into it.

The module is still being written. One exercise already exists as a draft:
[build-time secrets](build-secrets.md) lends a dummy credential to a single
build step and checks what the finished image keeps, so you can try it
without a registry account or a real secret.
