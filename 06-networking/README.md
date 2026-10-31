# 06: Networking

In the first module, two copies of the message service both listened on port
8000 inside their containers, yet each needed its own port on your computer.
Can you explain why? Keep your explanation handy, since this module builds a
more complete picture around it.

So far each service has worked alone. Now one needs to talk to another: a
small frontend has to call a small API, and the API shouldn't be reachable
from outside at all. We'll start both from one supplied image with
`docker run`, connect them on a network we create, and publish only the
frontend.

Once the request works, we'll follow it from the frontend to the API, to see
how a container name becomes an address and why the API needs no published
port. Then we'll break the connection in two different ways and learn to tell
a name problem from a port problem by reading what the frontend tells us.

Everything stays on one Docker host, with networks you create yourself. The
two services have no database or saved state, so you can recreate them as
often as an experiment needs.
