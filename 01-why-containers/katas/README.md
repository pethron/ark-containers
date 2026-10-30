# A service for the next shift

Your colleague needs the message service for a demonstration. They have Docker,
but no Python installation, and port 8080 is already reserved. You won't be
there to fix the command while they present it. Can you hand over something
they can actually use?

## Before you start

You need one working Docker setup from the
[installation chapter](../02-installing-docker.md), using Bash on Linux or
PowerShell 7 on Windows, and the course files. Open a terminal in
`01-why-containers/first-app`, beside the supplied [source file](../first-app/app.py).
The names `ark-handover` and `ark-handover-review` must be free, along with
two loopback ports other than 8080. This exercise creates at most two
containers, no volumes and no cloud resources.

The kata adapts the launch command from
[the first application](../03-your-first-application.md#2-read-the-launch-command);
if a setting looks unfamiliar, the option table there explains what it does.

??? note "Reference: the base launch command"

    This is the walkthrough's launch command, run from `first-app`. Your
    handover needs its own name, port and message.

    === "Linux (Bash)"

        ```bash
        docker run -d --name ark-message \
          --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
          -p 127.0.0.1:8080:8000 \
          python:3.12-alpine python /app/app.py
        ```

    === "Windows (PowerShell)"

        ```powershell
        docker run -d --name ark-message `
          --mount "type=bind,source=$($PWD.Path)\app.py,target=/app/app.py,readonly" `
          -p 127.0.0.1:8080:8000 `
          python:3.12-alpine python /app/app.py
        ```

## The handover

Write a short launch-and-check procedure using an available loopback port other
than 8080. Use the container name `ark-handover` and set a message that identifies
the demonstration. Include the source file with your instructions: the image
does not contain our application yet. The `MESSAGE` environment variable,
passed with `-e`, sets the text the service returns.

Use the base launch command above as a reference for your shell. In your
handover, provide both the Bash and PowerShell versions. The Docker settings
and expected service behavior must match.

Then run a second instance named `ark-handover-review`, with another message and
host port. Do not stop the first instance to make the second work. Keep both
source mounts read-only and published ports on loopback.

Before trying the commands, write down which options you expect to change and
which you expect to keep. If a name already exists, inspect it; do not remove an
unrelated container to make room.

## Show that it works

- Both URLs return the intended message and a different container hostname.
- Both `/health` URLs return `{"status": "ok"}`.
- You can find each request in the appropriate container's logs.
- After recreating one instance with a new message, the other still responds.
- Your instructions explain why local Python and a Dockerfile are unnecessary
  for this particular example, and what limitation remains.

If you're working together, let your colleague follow your instructions from
another checkout. Alone? Start from a fresh terminal without shell variables
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
Check that neither remains in `docker ps -a`. Your files and the downloaded
Python image stay on disk; no volume deletion or global prune is needed.

If you used those names, clean up with:

```text
docker stop ark-handover ark-handover-review
docker rm ark-handover ark-handover-review
docker ps -a --filter name=ark-handover
```

Keep the handover notes. After the image-building module, try removing the
source-file requirement without changing the service's HTTP behavior.
