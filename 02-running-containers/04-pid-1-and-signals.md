---
title: "Stopping a service"
track: architecture
---

# Stopping a service

The container disappeared from the running list. Does that mean the
application finished its work? Not necessarily: there is a difference
between asking a service to stop and forcibly ending it.

## Give the application a chance to finish

Use the working `ark-ops` from the configuration chapter, or launch it with
the [known-good command](01-observe-a-running-service.md#start-from-a-known-result).

```text
docker stop ark-ops
```

Docker normally sends a termination request called `SIGTERM` to the main
process, then waits. The application can use that opportunity to stop
accepting work, close files and exit. If it doesn't stop before the timeout,
Docker forcibly ends it.

Check what our example did:

```text
docker logs ark-ops
```

Look for `clean shutdown complete`. Our supplied wrapper handles the request
and writes that message before exiting. The original module-01 service did
not implement this shutdown procedure.

A real application needs checks appropriate to its work: a farewell log alone
doesn't establish that a database transaction or queued job was preserved.
The useful question is what must finish before the process disappears.

Start the service again and check its HTTP response:

```text
docker start ark-ops
```

Keep it running for the resource chapter, or stop and remove it if finishing.

??? note "Optional experiment: an application that ignores the request"

    Reserve `ark-ops-ignore` and loopback port 8083. Repeat the known-good
    launch with that name and port, adding `-e SHUTDOWN_MODE=ignore` before
    the image name. Verify its response, then run:

    ```text
    docker stop --timeout 2 ark-ops-ignore
    docker logs ark-ops-ignore
    ```

    The wrapper reports that it ignored the request. After two seconds Docker
    forces it to stop, so there is no clean-shutdown message.
    `--timeout` sets the waiting period; it doesn't make the application
    handle shutdown. Remove only this stopped experiment with
    `docker rm ark-ops-ignore`.

??? note "Why PID 1 and signals appear in troubleshooting"

    The main process is normally process number 1 inside the container.
    It receives Docker's stop request. A shell placed in front of a server may
    not forward that request as intended; using the server directly, an
    `exec` wrapper or an appropriate init process can matter.

    A forced kill (`SIGKILL`) cannot be handled by the application. Neither an
    init process nor a longer timeout teaches a server how to save its work.
    The [process deep dive](../advanced/linux-primitives/01-a-container-is-just-a-process.md)
    and [runtime supervision](../advanced/runtime-architecture/02-containerd-and-the-shim.md)
    explain the mechanisms when you need them.

Next, [limits and restart policies](05-limits-and-restart-policies.md).
