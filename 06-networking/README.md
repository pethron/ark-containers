---
pagination_next: 06-networking/01-connect-two-services
---

# 06: Networking

In the first module, two copies of the message service both listened on port
8000 inside their containers, yet each needed its own port on your computer.
Can you explain why? Keep your explanation handy, since this module builds a
more complete picture around it.

So far each service has worked alone. Now one needs to talk to another: a
small frontend has to call a small API, without publishing a host port for
the API. We'll start both from one supplied image with
`docker run`, connect them on a network we create, and publish only the
frontend. The API is still reachable by its peers and, on native Linux,
by the Docker host at its container address.

Once the request works, we'll break it in two different ways and learn to tell
a name problem from a port problem by reading what the frontend tells us.
Then we'll follow the restored request from the frontend to the API, looking
at name resolution, the bridge and the published port.

Everything stays on one Docker host, with networks you create yourself. The
two services have no database or saved state, so you can recreate them as
often as an experiment needs.
