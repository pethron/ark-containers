# 02: Running containers

The first service worked. Now someone wants to change it, stop it and start
it again tomorrow. Which of those actions keep its files and settings, and
which give you a new instance?

We'll keep the application you already know, open a shell alongside it and
follow a change from the working service to its replacement. Seeing the
server and shell as separate processes will help explain what keeps the
container alive, while a file left inside it will show what remains when
execution ends. Those observations will guide the configuration change and
shutdown, without requiring local Python, a Dockerfile or an advanced module.

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

The main experiments are an interactive shell, process lifetime, stop/start,
replacement and stopping the service. They use the unchanged module-01 application;
custom shutdown code is an optional advanced experiment, not part of this module.
We'll solve durable storage in module 05; resource
limits, automatic restart policies and memory-failure diagnosis belong to
module 09, not to this module's exercises.

## Before moving on

Before moving on, explain why leaving an `exec` shell doesn't stop the service,
but stopping the main process also ends that shell. Then connect that
distinction to the file experiment: which files and configuration survive a
restart, and when is replacement needed? If you study with someone, swap
handovers and try the other person's checks.

Optional [runtime depth](../advanced/runtime-architecture/README.md) explains
client/daemon/process boundaries. It isn't required to continue.

Next, [Images and registries](../03-images-and-registries/README.md):
identify exactly what runtime artifact you're handing to the next environment.
