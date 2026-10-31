# A service for the next shift

Your colleague needs the message service for a demonstration. They have Docker,
but no Python installation, and port 8080 is already reserved. You won't be
there to fix the command while they present it. Can you hand over something
they can actually use?

## Before you start

You need the Docker setup from [Before you start](../../before-you-start.md),
using Bash on Linux or PowerShell 7 on Windows; the course files aren't needed.
The names `ark-handover` and `ark-handover-review` must be free, along with
two loopback ports other than 8080. This exercise creates at most two
containers, no volumes and no cloud resources.

The kata adapts the launch command from
[the first application](../04-make-it-yours.md#read-the-launch-command);
if a setting looks unfamiliar, the option table there explains what it does.

??? note "Reference: the base launch command"

    This is the walkthrough's first launch command. Your handover needs its own
    name, port and message.

    ```text
    docker run -d --name ark-message -p 127.0.0.1:8080:8000 ghcr.io/pethron/ark-message:1
    ```

## The handover

Write a short launch-and-check procedure using an available loopback port other
than 8080. Use the container name `ark-handover` and set a message that identifies
the demonstration. The `MESSAGE` environment variable, passed with `-e`, sets
the text the service returns.

Your colleague may use either shell. A command written on one line works in both
Bash and PowerShell; if you split it over several lines, provide both versions,
since the line-continuation character differs. The Docker settings and expected
service behavior must match.

Then run a second instance named `ark-handover-review`, with another message and
host port. Do not stop the first instance to make the second work. Keep both
published ports on loopback.

Before trying the commands, write down which options you expect to change and
which you expect to keep. If a name already exists, inspect it; do not remove an
unrelated container to make room.

## Show that it works

- Both URLs return the intended message and a different container hostname.
- Both `/health` URLs return `{"status": "ok"}`.
- You can find each request in the appropriate container's logs.
- After recreating one instance with a new message, the other still responds.
- Your instructions explain why local Python and the course files are
  unnecessary, and which settings your colleague must choose at launch.

If you're working together, let your colleague follow your instructions on
their own machine. Alone? Start from a fresh terminal without shell variables
left over from the walkthrough and follow only your written handover.

<details>
<summary>The second instance won't start</summary>

Check the error before changing anything. A container name must be unique on
the engine; a published host address and port cannot already be occupied.
Neither rule requires changing the application's internal port 8000.

</details>

<details>
<summary>The container starts but the page fails</summary>

Compare the listening port in the logs with the target side of `-p`. Also check
whether your request is running on the machine whose loopback port you
published. A running process is not proof of an accessible HTTP service.

</details>

## Leave it tidy

Stop and remove only `ark-handover` and `ark-handover-review` if you created them.
Check that neither remains in `docker ps -a`. The downloaded image stays on
disk; no volume deletion or global prune is needed.

If you used those names, clean up with:

```text
docker stop ark-handover ark-handover-review
docker rm ark-handover ark-handover-review
docker ps -a --filter name=ark-handover
```

Keep the handover notes: the next time you hand someone a container, the
same checks tell them whether it really works.
