---
title: "Resource usage and failure"
track: architecture
---

# Resource usage and failure

> Draft relocated from module 02 for module 09 authoring. This is not yet a
> finished module-09 lesson. Its examples continue the original service from
> [limits and restart policies](06-limits-and-restart-policies.md); references
> to rejected settings and clean-shutdown logs refer to the separate
> [advanced shutdown experiment](../advanced/linux-primitives/shutdown-service/README.md).

Imagine the next person finds `ark-ops` stopped and follows a note that simply
says "restart it". That might resume a service you deliberately stopped, or
it might repeat the configuration error you already diagnosed. The command
is the same, but the reason for using it makes all the difference.

You now have enough observations to write a more useful procedure. Before
the kata, choose the next action for each situation below and explain what
you expect it to change:

- The log reports an invalid setting.
- The service stopped after your own stop request and logged a clean shutdown.
- The application ended abruptly, with no explanation in its log.

??? note "Compare your choices"

    The first needs a corrected configuration and a replacement. The second
    may only need `docker start` when you're ready to serve requests again.
    The third needs more information: neither a larger memory allowance nor
    repeated restarts is justified by silence alone.

Those choices use the same few tools for different purposes: `docker ps`
locates the instance, its logs tell us what the application reported, and HTTP
tests the result a user receives. The shell can help inspect files and
processes while the container is running, but it can't open a session in one
that has stopped. Rather than trying every tool each time, start with the
question you need to answer and choose the check that can answer it.

## If memory is the missing piece

One question we haven't observed directly is what happens when the application
needs more memory than it can get. It may fail an allocation or be killed
because memory is exhausted, which can leave much less explanation in its
log than our deliberate configuration mistake did. Raising the allowance
could help legitimate work, but it could also merely postpone a memory leak,
so we need more than an abrupt exit to justify that change.

The optional sections below show how a targeted `docker inspect` query can
provide information the application itself didn't write. You don't need to
provoke a memory failure to finish the module; for now, the useful extension
of our procedure is knowing when the familiar checks leave a question open.
We'll develop the broader diagnostic process in module 09.

??? note "Ask Docker whether it recorded an out-of-memory kill"

    `docker inspect` shows detailed container information. Instead of reading
    it all, ask for the field related to this question:

    ```text
    docker inspect --format '{{.State.OOMKilled}}' ark-ops
    ```

    `true` means Docker recorded an out-of-memory kill. Compare that with the
    application's log, its memory limit and the work it was doing. `false`
    doesn't tell you which other cause to pick.

    For a running service, `docker stats --no-stream ark-ops` gives a current
    sample. A quiet sample after restart cannot reconstruct a previous peak.

??? note "Optional: a small, bounded memory failure"

    This experiment is not required for the kata. Use a Linux engine
    with working memory and swap limits; read warnings in `docker info`.
    Check that `ark-oom` is unused.

    **Keep both limits unchanged.** The fixture tries to allocate 128 MiB
    inside a 32 MiB memory limit with no swap allowance. Never run it without
    those limits or move the allocation to your host.

    ```text
    docker run --name ark-oom --memory 32m --memory-swap 32m python:3.12-alpine python -c 'data=bytearray(128 * 1024 * 1024); print(len(data))'
    ```

    The foreground command is expected to fail. Check the stopped instance:

    ```text
    docker inspect --format '{{.State.OOMKilled}}' ark-oom
    docker logs ark-oom
    ```

    On the tested engine, Docker reports `true` and the allocation doesn't
    complete. If you see `MemoryError` or another result, preserve that output
    rather than relabelling it to match the example.

    For comparison, check that `ark-killed` is unused, then run:

    ```text
    docker run -d --name ark-killed python:3.12-alpine sleep 300
    docker kill ark-killed
    docker inspect --format '{{.State.OOMKilled}}' ark-killed
    ```

    Docker normally shows the same exit code, 137, for these two examples,
    but the second reports `false`: you explicitly killed it. The number
    alone didn't identify memory exhaustion.

    Remove only your stopped experiments:

    ```text
    docker rm ark-oom ark-killed
    ```

    Neither changes daemon settings or creates persistent volumes.

For kernel enforcement details, use the optional
[cgroup explanation](../advanced/linux-primitives/03-cgroups-v2.md) and
[inspection runbook](../advanced/linux-primitives/06-inspecting-namespaces-and-cgroups.md).
The main operating procedure doesn't depend on completing them.

## Hand over the decision, not just the command

The shell experiment connected the container's lifetime to its main process,
while the note showed why files can remain after all those processes end.
Together with the replacement and shutdown checks, that gives you a model
for planning a change rather than just a list of commands to repeat. Use it
when writing an incident procedure. The module-09 kata will combine these
observations with the later course's deployment and logging work.

When finished with the walkthrough, stop and remove only your `ark-ops`.
Its source files and runtime image remain available for the next exercise.

## References

- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
- [Docker stop behavior](https://docs.docker.com/reference/cli/docker/container/stop/)
