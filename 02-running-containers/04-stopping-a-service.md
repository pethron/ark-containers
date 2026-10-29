---
title: "Stopping a service"
track: architecture
---

# Stopping a service

In the shell experiment, stopping the server also ended the extra process
you had opened alongside it. You may also have noticed that Docker took
a few seconds to return. That pause comes from the difference between
asking a program to finish and forcing it to end.

## What Docker waits for

Use the running `ark-ops` from the configuration chapter, and send a request
in the browser before stopping it:

```text
docker stop ark-ops
```

Docker normally sends a termination request called `SIGTERM` to the main
process, then waits for it to exit. If the waiting period expires, it uses
`SIGKILL` to force termination. For these Linux containers the default wait
is ten seconds, which explains why stopping isn't always immediate.

Our original application doesn't implement a handler for that stop request.
When running as PID 1 in this image, it can remain running until Docker
forces it to end. Let the command finish, then check the result:

```text
docker ps -a
docker logs ark-ops
```

The container should be `Exited`, and its logs should still contain the
requests it served. There is no shutdown-complete message to look for:
this application doesn't write one, and being stopped doesn't prove that
it finished any work that was in progress.

For our message page, we can accept that limitation while learning the
lifecycle. An upload service or a worker would need application-specific
shutdown behavior to finish or safely interrupt its work. Docker provides
the request and waiting period, not that implementation; the optional
[shutdown experiment](../advanced/linux-primitives/shutdown-service/README.md)
explores the difference without making it a prerequisite here.

## Stop first, remove when ready

This is why `docker rm -f` is not just a shorter spelling of stop followed
by remove: it can forcibly kill running work without the initial waiting
period. For normal changes, stop the container, check its state and logs,
and only remove it when you no longer need that instance.

For now, we still want ours. Start it again and verify the replacement's
message and `/health` response:

```text
docker start ark-ops
```

You are reusing the container's settings, not bringing the old Python
process back to life. Leave it running for the
[final recap and kata](05-choose-the-fix.md), or stop and remove only your
`ark-ops` if finishing here.
