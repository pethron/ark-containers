---
title: "Limits and restart policies"
track: runbook
---

# Limits and restart policies

> Draft relocated from module 02. This material is retained for module 09
> authoring, not a finished continuation of its current chapter sequence.
> The exercises below use the original module-01 application via module 02.
> References to handled shutdown and rejected settings use the separate
> [advanced shutdown experiment](../advanced/linux-primitives/shutdown-service/README.md).

The replacement now serves the right message, and you know how to stop it
without confusing shutdown with removal. Before handing it over, we should
also decide how it shares the host with other work and what should happen
if its main process fails. We'll start with memory, then consider automatic
retries: the first limits what a running service can use, while the second
decides whether to run it again after an error.

## Give the service a memory budget

With `ark-ops` running, take a look at its resource use:

```text
docker stats --no-stream ark-ops
```

`--no-stream` prints one snapshot instead of continuously updating the display.
The memory column shows current usage and the limit visible to the container.
Without an explicit container limit, that ceiling can reflect the Docker
host's available memory, including the Linux VM when you use Docker Desktop.

We don't want this small service to have that whole allowance. Stop and remove
your own instance, then repeat the
[launch command](../02-running-containers/01-pick-up-the-service.md#start-from-a-known-result),
keeping your corrected message and adding `--memory 64m` before the image name.
This sets a 64 MiB memory limit:

```text
docker stats --no-stream ark-ops
```

Check that the limit is now about 64 MiB, and verify `/` and `/health` again:
we want to know both that the setting took effect and that the application
still does its job. If Docker warns that the host cannot enforce the limit,
resolve that limitation before treating the budget as active.

The value works for this small lab on the tested setup, but choosing it for
a different service would require measuring that service under its expected
workload, with room for peaks. Linux can also allow swap beyond the memory
limit, depending on the host and swap settings. We won't exhaust the service's
memory here; the optional failure lab uses an additional no-swap limit to
keep that separate experiment strictly bounded.

## Decide whether it should restart

The process model from the shell experiment gives us a useful starting point
for the second decision: once the main process ends, this execution is over.
By default, Docker leaves the container stopped, which lets us inspect a
failure without it repeatedly starting and failing. For a short
job like the version check, finishing is also exactly what we want.

For a long-running service, retrying after an error can be useful. For example,
`--restart on-failure:2` asks Docker to retry after an unsuccessful exit, with
at most two retries. You can add it before the image name when creating a
container; you don't need to recreate ours just to collect another option.

The advanced experiment's misspelled `gracefull` shows the limit of that approach: every attempt
would read the same bad setting and fail again. **A restart policy repeats
execution; it doesn't correct configuration.** It also responds to process
exit, not to the result a user receives, so neither a failed browser request
nor an unhealthy Docker healthcheck alone restarts a standalone container.

For this learning service, keeping automatic retries off makes failures easy
to examine. Bounded retries are a reasonable alternative if your handover
explains when to stop investigating repeated failures. An explicit `docker stop`
doesn't trigger `on-failure`: asking it to stop is not an application crash.

??? note "Optional: watch a finite retry"

    Check that `ark-retry` is unused. This short job waits 12 seconds, reports
    an error and exits. It runs three times at most: the initial attempt and
    two retries. The wait also keeps each run past Docker's ten-second
    successful-start monitoring threshold.

    ```text
    docker run -d --name ark-retry --restart on-failure:2 python:3.12-alpine sh -c 'echo Starting; sleep 12; echo Failed; exit 1'
    ```

    After about 40 seconds, inspect it:

    ```text
    docker ps -a
    docker logs ark-retry
    ```

    Expect a stopped container and three start/failure pairs. Allow up to a
    minute for scheduling. You don't need a particular error number to see
    that retrying didn't fix the deliberate failure.

    If stopping early, disable this policy first, then stop the container:

    ```text
    docker update --restart no ark-retry
    docker stop ark-retry
    ```

    Remove only your `ark-retry` after it has stopped. See the
    [restart-policy reference](https://docs.docker.com/engine/containers/start-containers-automatically/)
    for other policies and daemon-restart behavior.

??? note "CPU, process limits and kernel enforcement"

    Memory isn't the only shared resource. A CPU-heavy application can crowd
    out other work; one that creates too many processes or threads can cause
    a different kind of trouble. Docker provides `--cpus` and `--pids-limit`
    for those cases.

    Linux enforces these controls through cgroups. The
    [cgroups deep dive](../advanced/linux-primitives/03-cgroups-v2.md) explains
    how that works. Our service doesn't need those extra controls for the
    message change, so we won't add them to its launch.

Keep the corrected launch procedure, including its memory limit, so the next
person can reproduce the configuration rather than reconstruct it from memory.
Leave `ark-ops` running as we
[investigate resource failures](07-resource-usage-and-failure.md), or stop
and remove your instance if you are finishing here.
