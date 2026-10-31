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
connects the services by name and recreates only what changed. We'll also
look closely at what `docker compose down` removes, because the answer
decides whether your data survives.

The example is a local exercise. It doesn't configure health checks or
secrets, so treat it as a clear starting point for describing a stack and not
as a deployment template.

The optional [application workflow](../advanced/compose-workflows/README.md)
uses those Compose skills with a database, cache and reverse proxy, including
readiness checks and development changes. Keep this module's small stack for
the exercises here; that workflow begins with its own supplied application.
