# 07: Compose

Two services that work together, a web frontend and the API it calls, take a
careful sequence of commands to start by hand: build an image, create a
network, start each container with the right name, options and port. Here we
write that setup down in a `compose.yaml` file, start the whole application
with one command, and see what Compose creates, changes and removes on our
behalf.

## What you will learn

- Translate a sequence of `docker` commands into a Compose file and run the
  stack with `docker compose up` and `down`
- Explain how Compose names a project's objects, connects services by name
  and recreates only what changed
- Predict what `down` removes and why named volumes survive it

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Describe the stack in a file](01-describe-the-stack-in-a-file.md) | R |
| 02 | [What Compose manages for you](02-what-compose-manages-for-you.md) | A |

The [supplied Compose file](stack/compose.yaml) builds the frontend and the
API from the [network service](stack/network-service/README.md) next to it.
We'll read the file, start the stack, then see what Compose changes when you
edit one of its settings.

Finish with [add the notes service](katas/README.md): extend the file with
the supplied [notes service](stack/notes-service/README.md) and keep its
notes across `down` and `up`.

## Scope

The module covers the Compose file and the commands you need to run and
inspect a stack. The supplied example is a local exercise; it doesn't
configure health checks or secrets.

Explain what `docker compose up -d` does when nothing in
the file has changed, and which command would delete your notes.
