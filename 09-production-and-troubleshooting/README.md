# 09: Production and troubleshooting

## What you will learn

- Healthcheck internals and restart policies
- Resource usage, memory limits and bounded retries
- OOM killer and logging drivers
- Swarm in brief, and why Kubernetes comes next

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Healthchecks and restart policies](01-healthchecks-and-restart-policies.md) | A |
| 02 | [OOM killer and logging drivers](02-oom-killer-and-logging-drivers.md) | A |
| 03 | [Swarm in brief](03-swarm-in-brief.md) | A |
| 04 | [From Swarm to Kubernetes](04-from-swarm-to-kubernetes.md) | A |
| 05 | [Triage checklist](05-triage-checklist.md) | R |
| 06 | [Limits and restart policies](06-limits-and-restart-policies.md) | R |
| 07 | [Resource usage and failure](07-resource-usage-and-failure.md) | A |

This module is in preparation. Chapters 06 and 07 preserve drafts relocated
from module 02; they use the original application, with shutdown-specific
observations linked to the separate advanced experiment, and need integration into
the final production scenario. Their presence does not make this a finished
seven-chapter sequence. Healthchecks and logging drivers remain planned in
chapters 01 and 02.

## Katas

In [`katas/`](katas/). Planned:

- Crashloop triage
- Deploy the voting app on Swarm
