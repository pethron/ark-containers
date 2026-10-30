# 02: Running containers

The first service worked. Now someone wants to change it, stop it and start
it again tomorrow. Which of those actions keep its files and settings, and
which give you a new instance?

We'll use a copy of the application you met in module 01, open a shell
alongside it and follow a change from the working service to its replacement.
Seeing the server and shell as separate processes will help explain what keeps
the container alive, while a file left inside it will show what remains when
execution ends. Those observations will guide the configuration change and
shutdown; Python installation and image builds can wait.

## What you will learn

- Tell the container apart from its running process
- Open an interactive shell and predict how its lifetime differs from the server's
- Predict which files and settings survive stop/start or replacement
- Apply a new configuration by replacing the instance
- Stop the service and distinguish a stopped process from a clean application shutdown

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Pick up the service](01-pick-up-the-service.md) | R |
| 02 | [Inside the running container](02-inside-the-running-container.md) | A |
| 03 | [Restarting isn't replacing](03-restarting-isnt-replacing.md) | R |
| 04 | [Stopping a service](04-stopping-a-service.md) | A |
| 05 | [Choose the fix](05-choose-the-fix.md) | A |

## Katas

- [A service change someone else can repeat](katas/README.md): plan an update,
  verify the filesystem boundary and leave a reusable procedure.

## Before moving on

Try explaining why leaving an `exec` shell doesn't stop the service,
but stopping the main process also ends that shell. Then connect that
distinction to the file experiment: which files and configuration survive a
restart, and when is replacement needed? If you study with someone, swap
handovers and try the other person's checks.

Optional [runtime depth](../advanced/runtime-architecture/README.md) explains
client/daemon/process boundaries. It isn't required to continue.

Next: [Images and registries](../03-images-and-registries/README.md).
