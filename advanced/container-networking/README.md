# Container networking

In the networking module a frontend found an API by name, and two programs
listened on port `8000` without conflict. The core module follows the bridge
and published port behind that connection. This optional deep dive looks
further at the host-side path and other network choices.

We'll look at the interfaces inside a container, what a published port turns
into on the host, why the default bridge doesn't resolve container names, and
when the `host`, `none` and other network drivers are the better choice.

The commands use the `ark-network:v1` image and the `ark-net` stack from the
first networking chapter, on the same Docker setup as the core course. Looking
at the host side of the bridge needs a Linux Docker Engine host; on Docker
Desktop that part happens inside its virtual machine, so the chapter describes
it instead. Multi-host overlay networks and Kubernetes networking are named
for orientation only, and changing firewall rules is outside this deep dive.
