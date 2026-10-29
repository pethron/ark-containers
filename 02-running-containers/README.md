# 02: Running containers

The first service worked. Now take responsibility for the next shift: find out
what it is doing, replace its configuration and diagnose a stopped service.

Start with the working application in chapter 01. The supplied wrapper preserves
its HTTP routes while giving us controlled startup and shutdown behaviors.
No new language, Dockerfile, Compose setup or advanced module is required.

## What you will learn

- Container states and lifecycle
- Changing configuration by recreating a container
- Stopping a service and checking its logs
- Choosing a memory budget and understanding restart behavior

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Observe a running service](01-observe-a-running-service.md) | R |
| 02 | [Container lifecycle and states](02-container-lifecycle-and-states.md) | A |
| 03 | [Configure and replace an instance](03-configure-and-replace.md) | R |
| 04 | [Stopping a service](04-pid-1-and-signals.md) | A |
| 05 | [Limits and restart policies](05-limits-and-restart-policies.md) | R |
| 06 | [Resource usage and failure](06-resource-usage-and-failure.md) | A |

## Katas

- [A service for the next shift](katas/README.md): diagnose a configuration
  fault, verify a replacement and write an operating handover.

The required route is observe, stop/start, replace and diagnose.
Counted retries, ignored shutdown requests, bounded memory failures and kernel
mechanisms are optional sections, not additional entry requirements.

## Before moving on

From memory, explain which configuration survives restart, when replacement
is needed, and what evidence you would read if the service stopped.
If you study with someone, swap handovers and try the other person's checks.

Optional depth is linked where it helps: [cgroups](../advanced/linux-primitives/03-cgroups-v2.md)
for enforcement and [runtime ownership](../advanced/runtime-architecture/README.md)
for client/daemon/process boundaries. Neither is required to continue.

Next, [Images and registries](../03-images-and-registries/README.md):
identify exactly what runtime artifact you're handing to the next environment.
