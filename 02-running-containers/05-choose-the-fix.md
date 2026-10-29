---
title: "Choose the fix"
track: architecture
---

# Choose the fix

Imagine the next person finds `ark-ops` stopped and follows a note that simply
says "restart it". That might resume a service you deliberately stopped, or
it might leave an unwanted message unchanged. The command
is the same, but the reason for using it makes all the difference.

The experiments give you a way to make that decision without guessing. When
you left the extra shell, the server kept answering; when the main process
ended, both the service and the open shell stopped. The note survived because
the container still existed, not because any of those processes continued
running. A replacement could use the same name and image without inheriting
the old instance's files.

Before the kata, put those observations to work. For each situation below,
choose the next action and explain what you expect it to change:

- You left the shell, but now want to inspect the running server again.
- The service stopped after your own stop request.
- The page still shows the old message after restarting the container.

??? note "Compare your choices"

    Open another shell with `docker exec` for the first situation: the server
    doesn't need restarting. In the second, use `docker start` when you're
    ready to serve requests again. The third needs a corrected configuration
    and a replacement, because repeating execution won't change the setting.

Those choices use familiar checks for different purposes. `docker ps` tells
you whether the instance is running, logs explain what the application reported,
and HTTP tests the result a user receives. A shell lets you inspect files and
processes while the container is running, but it cannot open a session in one
that has stopped. If these checks don't explain a failure, keep the information
you have rather than removing the instance and losing the chance to investigate.

You now have a model for planning a change, not just commands to repeat. Use
it in the [service-change kata](katas/README.md), where you'll choose the
sequence yourself and leave the reasoning for someone else to follow.
When finished with the walkthrough, stop and remove only your `ark-ops`;
its source files and runtime image remain available for the next exercise.
