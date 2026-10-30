# Container networking

In [module 06](../../06-networking/README.md) a frontend found an API by
name, and two programs listened on port `8000` without conflict. The core
module explains that with a picture: a private office network with a switch
and a door. This optional deep dive opens the picture up.

- [Bridges, ports and network drivers](bridges-ports-and-network-drivers.md):
  the interfaces inside a container, what a published port turns into, why the
  default bridge doesn't resolve names, and when to use `host`, `none` and the
  other drivers.

The commands use the `ark-network:v1` image and the `ark-net` stack from
[module 06 chapter 01](../../06-networking/01-connect-two-services.md), on
the same Docker setup as the core course. Looking at the host side of the
bridge needs a Linux Docker Engine host; on Docker Desktop that part happens
inside its virtual machine, so the chapter describes it instead.

Multi-host overlay networks and Kubernetes networking are named for
orientation only. Changing firewall rules is outside this deep dive.
