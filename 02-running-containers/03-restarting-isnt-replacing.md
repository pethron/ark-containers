---
title: "Restarting isn't replacing"
track: runbook
---

# Restarting isn't replacing

You left the shell, stopped the server and started it again, yet both the
original message and your note remained. That's useful when you want to resume
the same service, but now someone wants the page to say `Configured replacement`.
To make that change, we need to supply a new setting rather than simply start
the old process again.

## Replace the configuration

Continue with `ark-ops` from the previous chapter, starting it first if you
paused. Before replacing anything, let's also try the shortcut people often
reach for:

```text
docker restart ark-ops
docker exec ark-ops cat /tmp/ark-note
```

The note should still be there, and the browser should still show
`Ready for the next shift`. `docker restart` stops and starts the same
container, using the settings it already has; it doesn't accept a new message.
To supply that setting, stop and remove this instance:

```text
docker stop ark-ops
docker rm ark-ops
```

Run the [launch command](01-pick-up-the-service.md#start-from-a-known-result)
again, changing only `-e MESSAGE="Ready for the next shift"` to
`-e MESSAGE="Configured replacement"`. Once you've checked the new message
in the browser, predict whether reusing the name also brought back the note:

```text
docker exec ark-ops cat /tmp/ark-note
```

This time `cat` should report `No such file or directory`: the new container
has the old name, but it doesn't inherit the old container's writable files.
Your course files and the Python image remain available, which is why the
replacement can run, while the temporary note belonged to the removed instance.

**Restart keeps the container; replacement creates another one.** If that
note had been important application data, recreating the service would have
thrown away something we needed. We would need to keep that data outside
the container's lifecycle, which is the problem we'll solve in module 05.

## Leave a change you can repeat

Verify both `/` and `/health`, then keep the replacement's launch command
in your notes. Fixing files by hand inside
a running container might appear quicker, but you've just seen why that change
wouldn't automatically reach its replacement.

Options such as `-e` go before the image name; the command after the image
starts the application. We'll explore that division further when we build
images. For now, keep the working `ark-ops` for
[the shutdown chapter](04-stopping-a-service.md).
