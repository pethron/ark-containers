# A service change someone else can repeat

A team has adopted your message service for a small status page. They want
to change its message without depending on you to remember what was typed
last time. Your job is to make the change, verify it, and leave a procedure
another person can use.

Choose the audience for the page and two useful messages: the current one and
its replacement. Use the original [application](../../01-why-containers/first-app/README.md),
Linux containers and a terminal in `01-why-containers/first-app`. You can refer to the
[paired launch commands](../01-pick-up-the-service.md#start-from-a-known-result),
but plan the sequence before executing it.

## The change request

Use only a container named `ark-change` and a free loopback port other than
8082. Check that the name is unused; don't remove someone else's container
to make it available.

Your procedure must satisfy these conditions:

- The original service returns your first message and a successful `/health`.
- You open an interactive shell alongside the server, identify the main
  process and create `/tmp/change-note` outside the read-only application mount.
  Leaving that shell doesn't stop HTTP; stopping the container from a second
  host terminal while a new shell is open ends that session too.
- The note is still readable after starting the same container again.
- A replacement on the same host port returns your second message. The old
  note is absent, while the host's source files are unchanged.
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
results and the named cleanup. Use your chosen
shell for the procedure and link the paired reference for someone using the
other shell.

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
the name or port, or is the source file missing from your current directory? Docker's launch
error and the application's logs answer different questions.

</details>

Ask someone to follow your procedure, or try it yourself in a fresh terminal
using only your notes. Remove only the `ark-change` you created when finished.
No signal-handling code or host/daemon reconfiguration is part of this kata.
