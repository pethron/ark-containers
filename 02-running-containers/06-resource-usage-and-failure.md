---
title: "Resource usage and failure"
track: architecture
---

# Resource usage and failure

The service stopped. Should we increase its memory, restart it or correct a
setting? Those are different fixes. Start with what happened, not a command
you hope will make the symptom disappear.

## Start with the evidence you already know

Find your service in `docker ps -a`, then read `docker logs ark-ops`.
An invalid-setting message points to configuration. A clean-shutdown message
after your stop request is expected. An abrupt end without an explanation
needs more investigation, not an automatic memory increase.

If it is still running, compare its HTTP response with
`docker stats --no-stream ark-ops`. A running process can fail requests, and
a short usage sample can miss a spike.

## When memory is a plausible cause

A container can stop when it exceeds its available memory. To ask Docker
whether it recorded an out-of-memory kill for this service, use one targeted
inspection:

```text
docker inspect --format '{{.State.OOMKilled}}' ark-ops
```

`true` is useful evidence of an out-of-memory kill. Compare it with the logs,
the configured budget and the work being processed. `false` is not a diagnosis
of some other specific cause.

A justified higher budget can help a workload that legitimately needs more
memory. It won't fix a wrong setting, and may only delay a memory leak.
A restart policy can restore execution but doesn't remove either cause.

## A completion code isn't an explanation

You may notice a number beside `Exited` in Docker's listing. Treat it as a
clue, not a diagnosis to memorize. For example, a forced stop and a memory kill
can display the same code. Read the application output and engine evidence
before choosing a fix.

??? note "Optional: a small, bounded memory failure"

    This experiment is not required for the handover kata. Use a Linux engine
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

Finish with the [next-shift kata](katas/README.md): verify the service, correct
a bad setting and leave a usable procedure for someone else. Stop and remove
your own `ark-ops` when finished.

## References

- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
- [Docker stop behavior](https://docs.docker.com/reference/cli/docker/container/stop/)
