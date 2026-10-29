---
title: "Configure and replace an instance"
track: runbook
---

# Configure and replace an instance

You restart a container, but it still serves the old message. Did Docker
ignore your change? The important distinction is simpler: restarting an
existing container doesn't give it new settings.

Run from the course root. The previous chapter removed `ark-ops`; check that
the name and port 8082 are free, then use the
[launch command](01-observe-a-running-service.md#start-from-a-known-result).
Check its message in the browser.

## Restart keeps the configuration

```text
docker restart ark-ops
```

Request the page again. It still says `Ready for the next shift`.
Restarting stopped and started the same container. Its original message,
mount and port settings stayed with it.

To supply a different message, stop and remove that instance:

```text
docker stop ark-ops
docker rm ark-ops
```

Repeat the launch command with just one change:
`-e MESSAGE="Configured replacement"`. Verify the new message in the browser.
`-e` supplies a setting at container creation; editing a launch command in
your notes doesn't modify an already-created container.

## What if a setting prevents startup?

The supplied wrapper also reads `SHUTDOWN_MODE`. Its normal value is
`graceful`. Let's deliberately misspell it.

First stop and remove your own `ark-ops`. Then repeat the launch command with
the additional setting `-e SHUTDOWN_MODE=gracefull` **before the image name**.
The image stays the same.

```text
docker ps -a
```

Find `ark-ops`: it should now be `Exited`. Read why:

```text
docker logs ark-ops
```

Expect:

```text
Invalid SHUTDOWN_MODE='gracefull'; choose graceful or ignore.
```

The application started, checked its configuration and stopped because the
value was invalid. Docker isn't broken. You may also see a number beside
`Exited`: programs report a completion code, with zero conventionally meaning
success and nonzero meaning an error. You don't need to memorize our example's
number; its message tells us what to fix.

Predict whether `docker restart ark-ops` could fix the spelling. It can't:
the invalid value is part of the existing container's configuration.

Remove the stopped container, then repeat the launch command without the
misspelled setting. Check `/` and `/health` again and keep this working
instance for the shutdown chapter.

## Keep the change reproducible

Keep the corrected launch procedure in your handover. Don't repair a
deployment by editing files interactively inside its container.
Options such as `-e` go before the image name; what follows the image is the
command to run inside it. We'll return to that boundary when we build images.

If finishing here, stop and remove only `ark-ops`. Otherwise continue with
[stopping the service](04-pid-1-and-signals.md).
