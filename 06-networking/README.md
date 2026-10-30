# 06: Networking

Your services have so far worked alone, each in its own container. Now one
needs to talk to another. We'll connect a small frontend
to a small API, see how the frontend finds the API by name, and learn to
tell what's wrong when it can't.

You'll start both services with `docker run` from one supplied image,
publish only the frontend, and let the API stay private to the network.

## What you will learn

- Connect two services on a network you create, so they find each other by
  container name
- Explain how the name becomes an address, and why only the frontend needs
  a published port
- Tell a name problem from a port problem by reading the frontend's answer

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [Connect two services](01-connect-two-services.md) | R |
| 02 | [How the request finds the API](02-how-the-request-finds-the-api.md) | A |
| 03 | [Diagnose a broken connection](03-diagnose-a-broken-connection.md) | R |

The chapters use the [network service fixture](network-service/README.md):
two tiny HTTP servers with no database or persistent state. You'll build them
from the supplied files and follow a request from the frontend to the API.

Finish with [reconnect the services](katas/README.md): repair a broken stack,
remove a port that shouldn't be published and adapt to a renamed API.

## Scope

The module stays on one Docker host with networks you create yourself. What
the bridge is made of, how published ports are implemented, and the other
network types such as `host` and `none` live in the optional
[container networking deep dive](../advanced/container-networking/README.md).

Can you explain how the frontend finds the API and why the API
needs no published port?

Next: [Compose](../07-compose/README.md).
