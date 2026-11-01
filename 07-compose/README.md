# 07: Compose

Think about how the frontend and the API started in the networking exercises:
build an image, create a network, then start each container with the right
name, options and port. How many of those details could you reproduce from
memory next week? That's the problem this module solves.

Here we write that setup down in a `compose.yaml` file and start the whole
application with one command. The file becomes the description someone else
can read, review and run, instead of a sequence of commands kept in a
terminal history.

We'll read the supplied file, start the stack, and then see what Compose
creates, changes and removes on our behalf: how it names a project's objects,
connects the services by name and recreates only what changed. We'll inspect
the labels and engine events behind those operations, and look closely at what
`docker compose down` removes, because the answer decides whether your data
survives.

The example is a local exercise. It doesn't configure health checks or
secrets, so treat it as a clear starting point for describing a stack and not
as a deployment template.

Once the small stack is familiar, we'll run a
[reading-list application](../advanced/compose-workflows/README.md) with a
database, a proxy and later a cache. That's where health checks, secrets,
backups and live code changes come in. It starts from its own supplied files,
so the small stack can stay as it is.
