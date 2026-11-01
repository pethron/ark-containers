---
title: "From docker run to a process"
track: architecture
---

# From `docker run` to a process

You've started, stopped and replaced `ark-ops`, and the same `docker`
command gave you a view of its processes and logs. What is actually listening
to those requests? Let's follow one more container from creation to removal,
then use that path to tell a connection problem from an application problem.

## Find the engine

Run these commands from your host terminal:

```text
docker context show
docker version
docker info
```

`docker` is the **client**. It sends requests to a Docker **engine**, whose
daemon manages containers, images, networks and volumes. `docker version`
shows a Client section and, when the engine is reachable, a Server section.
`docker context show` names the selected context, which describes where the
client normally connects; environment settings can override that selection.

Look in the server information for its operating system and architecture.
`docker info` also reports an operating system and kernel version. On native
Linux Engine these describe the Linux machine running the engine. With Docker
Desktop on Windows or macOS, the engine and Linux containers run in a Linux
environment managed by Desktop. You don't need to set up or administer that
environment yourself.

The **kernel** is the operating system component that runs processes and
manages resources. The container shares the engine host's Linux kernel, not
the Windows or macOS kernel. This is also where the host PID from `docker top`
belongs. If the client cannot reach the server, check the selected context
and whether the engine is running before trying to diagnose application logs.

## Watch a container begin

Leave `ark-ops` running. We'll create a second instance named `ark-engine`,
without publishing a port, so it won't take over the page you're using.
Check `docker ps -a` first and continue only if that name is free.

Open a second host terminal and start an event stream for that name:

```text
docker events --filter container=ark-engine
```

Back in the first terminal, create the container without starting it:

```text
docker create --name ark-engine ghcr.io/pethron/ark-message:1
docker inspect --format 'status={{.State.Status}} pid={{.State.Pid}}' ark-engine
```

The status is `created` and the PID is `0`: the engine has recorded the
container and its settings, but its main process hasn't started. Now start it:

```text
docker start ark-engine
docker inspect --format 'status={{.State.Status}} pid={{.State.Pid}}' ark-engine
docker top ark-engine -o pid,args
docker logs ark-engine
```

The status should be `running`, and its host PID should match the Python
process in `docker top`. Once the application has started, its logs show
the listening message; if they are empty, wait a moment and check again.
Although it listens inside the container, there is no published host port
for this instance.

`docker run` combines creation and start in one command. The engine prepares
the image and container settings, delegates execution to a runtime, and keeps
track of the resulting container. The application serves its own requests
after it starts; the Docker client is not in the path of every page request.

## Follow the stop

Predict what will remain after stopping the process, then check:

```text
docker stop ark-engine
docker inspect --format 'status={{.State.Status}} pid={{.State.Pid}}' ark-engine
docker rm ark-engine
```

The stopped object is still available for inspection until you remove it.
In the event terminal, look for creation, start, stop and removal among the
events; their timestamps and additional events depend on the engine. Stop
that event stream with Ctrl+C. This cleanup removes only `ark-engine`;
`ark-ops` and the image remain.

If creation failed, the client can show an engine error even though no
application process exists yet. If the process started and then exited,
its logs may explain what the application reported. Which evidence would
you look for first if `docker version` cannot show a Server section?

Keep `ark-ops` running for [the boundary comparison](07-namespaces-and-cgroups.md).
