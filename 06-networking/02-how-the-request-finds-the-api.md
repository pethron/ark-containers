---
title: "How the request finds the API"
track: architecture
---

# How the request finds the API

A small frontend, `ark-web`, calls a small API, `ark-api`, by container name
and gets an answer. Networks deliver requests to addresses, so somewhere the
name became an address, and the request travelled to it. Let's look at the
evidence Docker gives us, then build a picture of the trip that will help you
when a connection fails.

## Look at the network

Ask Docker who is on `ark-net`:

```text
docker network inspect --format '{{range .Containers}}{{.Name}} {{.IPv4Address}} {{end}}' ark-net
```

You'll see both containers, each with its own address, for example
`ark-api 172.18.0.2/16 ark-web 172.18.0.3/16`. Docker assigned those
addresses when the containers joined the network, so your numbers may
differ. Now ask the frontend what `ark-api` means to it:

```text
docker exec ark-web python -c "import socket; print(socket.gethostbyname('ark-api'))"
```

It prints the API's address on `ark-net`, the same one the inspect showed.
Finally, look at where the frontend sends its name lookups:

```text
docker exec ark-web cat /etc/resolv.conf
```

The `nameserver 127.0.0.11` line points to a small name server that Docker
runs for containers on networks you create. Docker's default network, the
one containers join when you don't choose a network, has no such name
server, so two containers started there can't find each other by name.

## Picture the trip

Think of `ark-net` as a small private office network. Each container has its
own network card, its own address and its own set of ports. That's why both
programs can listen on port `8000` without getting in each other's way: each
port `8000` belongs to a different container. Docker plugs the containers
into a virtual switch, called a **bridge**, so they can talk to each other.

When the frontend needs `ark-api`, it asks Docker's name server, which knows
the current address of every container on the network. The frontend then
sends its HTTP request to that address on port `8000`. If Docker replaces the
API container and it gets a new address, the name server answers with the new
one, and the frontend's configuration doesn't change.

Your own request takes a different road into the office. A published port is
a door from your computer: Docker forwards traffic arriving on
`127.0.0.1:8080` to port `8000` of `ark-web`. On Docker Desktop the
containers run inside a Linux virtual machine, and Desktop forwards the
traffic into it for you. The API has no door of its own, and doesn't need
one, because the frontend calls it from inside the office.

**When to use this picture:** when a connection fails, ask three questions
in order. Does the name resolve to an address? Is a program listening on the
destination port? Does the application answer the request? The next chapter
breaks the first two links on purpose, so you can see which answer changes.

If you're curious about what the switch is made of, or about network types
other than the bridge, the optional
[container networking deep dive](../advanced/container-networking/README.md)
opens them up. Nothing in the rest of this module depends on it.

This chapter changed nothing, so `ark-api`, `ark-web` and `ark-net` are still
running. The next chapter breaks this same stack on purpose.
