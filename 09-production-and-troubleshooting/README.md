# 09: Production and troubleshooting

Sooner or later the service you handed over stops answering, and the person
looking at it has only a note that says "restart it". Is the process stuck,
out of memory, or failing on every start? Restarting might fix it, hide the
cause, or repeat the same error in a loop.

This module will be about answering those questions from evidence. We'll
decide what a container may use and what should happen when it fails, then
read the signals the Engine leaves behind: exit codes, health status, memory
kills and logs. From there we'll build a short triage routine that tells you
where to look first, and see how far a single Docker host can take you before
an orchestrator becomes the better tool.

The module is still being written. Two drafts, moved here from the operating
module, already explore the first part with the original application:
[limits and restart policies](06-limits-and-restart-policies.md), followed by
[resource usage and failure](07-resource-usage-and-failure.md), which
continues the same service.
