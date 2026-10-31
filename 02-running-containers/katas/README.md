# A service change someone else can repeat

A team has adopted your message service for a small status page. They want
to change its message without depending on you to remember what was typed
last time. Your job is to make the change, verify it, and leave a procedure
another person can use.

Choose the audience for the page and two useful messages: the current one and
its replacement. Plan the sequence before executing anything.

## Before you start

You need a working Docker setup running Linux containers, using Bash on Linux
or PowerShell 7 on Windows. The kata uses the course's message service image,
`ghcr.io/pethron/ark-message:1`; the course files aren't needed.

??? note "Reference: the module's launch command"

    This is how the walkthrough started `ark-ops`. Your procedure needs its own
    name and messages.

    === "Linux (Bash)"

        ```bash
        docker run -d --name ark-ops \
          -e MESSAGE="Ready for the next shift" \
          -p 127.0.0.1:8080:8000 \
          ghcr.io/pethron/ark-message:1
        ```

    === "Windows (PowerShell)"

        ```powershell
        docker run -d --name ark-ops `
          -e MESSAGE="Ready for the next shift" `
          -p 127.0.0.1:8080:8000 `
          ghcr.io/pethron/ark-message:1
        ```

## The change request

Use only a container named `ark-change`, published on `127.0.0.1:8080`.
Check that the name and port are unused; don't remove someone else's container
to make it available.

Your procedure must satisfy these conditions:

- The original service returns your first message and a successful `/health`.
- You open an interactive shell alongside the server, identify the main
  process and create `/tmp/change-note`.
  Leaving that shell doesn't stop HTTP; stopping the container from a second
  host terminal while a new shell is open ends that session too.
- The note is still readable after starting the same container again.
- A replacement on the same host port returns your second message. The old
  note is absent, while the image is unchanged.
- You can stop the replacement, verify that it is `Exited`, read its request
  logs, start it again and get the second message back. Don't require a
  shutdown-complete log: this application doesn't produce one.

The page can be unavailable during the change. Zero-downtime replacement,
volumes, image builds and Python edits are outside this task.

## Before you launch the replacement

Write down which actions keep the existing container and which create a new
one, and predict what will happen when the extra shell or the main process
ends. Compare those predictions with the shell and HTTP observations before
moving on to replacement. The note should survive a stop/start but disappear
in the replacement; that missing file is a required result here, not something
to repair.

## Leave a usable procedure

Include the launch command, the order of the change, checks with expected
results and the named cleanup. Use your chosen shell for the procedure; if you
split a command over several lines, note the continuation character someone
using the other shell needs.

Also explain what you'd change if the note were valuable application data.
You don't need to implement that storage solution yet. The important part
is recognizing when replacement would throw away something you need.

<details>
<summary>Hint: the name stayed the same, but the note disappeared</summary>

A name identifies a container; reusing the name doesn't restore the previous
instance's files. Compare stop/start with remove/run.

</details>

<details>
<summary>Hint: the new message didn't appear</summary>

Compare the launch you intended with the container you actually started.
Restarting an old instance doesn't apply a newly edited `-e MESSAGE` option.

</details>

<details>
<summary>Hint: the new container won't start</summary>

Read the error before changing anything. Is the old container still holding
the name or port, or does the image name have a typo? Docker's launch error and
the application's logs answer different questions.

</details>

Ask someone to follow your procedure, or try it yourself in a fresh terminal
using only your notes. Remove only the `ark-change` you created when finished:

```text
docker stop ark-change
docker rm ark-change
```

No signal-handling code or host/daemon reconfiguration is part of this kata.
