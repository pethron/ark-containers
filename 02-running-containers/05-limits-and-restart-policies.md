---
title: "Limits and restart policies"
track: runbook
---

# Limits and restart policies

The service is running, but how much memory could it use? And if it crashes,
should Docker start it again? A resource limit and a restart policy answer
different questions. Let's introduce them separately.

## Give the service a memory budget

Check `docker stats --no-stream ark-ops` while your service is running.
It shows usage, not a budget you deliberately chose.

Stop and remove your own `ark-ops`. Repeat the
[launch command](01-observe-a-running-service.md#start-from-a-known-result),
adding `--memory 64m` before the image name.
This gives the container a 64 MiB memory limit. Check its HTTP response and
run `docker stats --no-stream ark-ops` again.

The limit is an example, not a production recommendation. A real budget must
fit the application and leave room for its work. A low snapshot doesn't prove
the application will never need more. Read engine warnings: resource controls
depend on host support.

This ordinary service is not an exhaustion test. The next chapter's optional
failure experiment uses an additional no-swap control to keep its allocation
strictly bounded. Don't remove those controls.

## Decide whether it should restart

Without a restart policy, a stopped application stays stopped. To ask Docker
to restart a service after an application error, add `--restart on-failure:2`
when creating it. The `:2` caps retries at two, so a broken service won't loop
forever in this lab.

Don't recreate the service just to collect every available option.
First decide whether automatic recovery fits the task. A one-off command and
a long-running HTTP service have different requirements.

A restart policy doesn't repair a bad setting or a wrong port. An explicit
`docker stop` is also different from a crash: it doesn't trigger this retry.
An unhealthy healthcheck alone doesn't restart a standalone Docker container.

??? note "Optional: watch a finite retry"

    Check that `ark-retry` is unused. This fixture waits 12 seconds, reports an
    error and exits. It runs three times at most: the initial attempt and two
    retries.

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

    `--cpus` limits CPU scheduling time; `--pids-limit` limits tasks including
    threads. Neither is needed to understand today's message-setting change.
    Introduce them when the workload calls for that control.

    Linux enforces resource budgets through cgroups. The
    [cgroups deep dive](../advanced/linux-primitives/03-cgroups-v2.md) explains
    the hierarchy and shows kernel-level inspection. You don't need to read
    controller files or convert nano-CPU values to operate this service.

Check the service once more. Keep your launch procedure and its chosen budget
for the [failure discussion](06-resource-usage-and-failure.md), or stop and
remove `ark-ops` if finishing here.
