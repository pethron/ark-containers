# Where did the request stop?

A colleague reports that "Docker is broken". One command never reaches the
engine, another creates an object but cannot start its executable, and a third
runs a program that immediately fails. Those are different incidents, even if
all three end without a healthy service.

Use a working Linux Docker setup and Bash, after the
[engine walkthrough](../01-the-docker-engine.md). The fixtures use a small
multi-platform Alpine image, no bind mounts, no volumes and no published ports.
In a rootful Linux lab, prefix Docker commands with `sudo`.

## Before running

Check that `ark-runtime-missing` and `ark-runtime-exit` are unused names:

```bash
docker ps -a --filter name=ark-runtime
docker pull docker.io/library/alpine:3.22
```

Do not delete an existing object that isn't yours. Record your prediction for
each case: did the client contact the engine, did an application process start,
and which evidence could distinguish those outcomes?

## Case A: a client without a route to the engine

Use a fresh terminal. Display its Docker context and environment without
changing them permanently:

```bash
docker context show
env | grep '^DOCKER' || test "$?" -eq 1
```

Now deliberately select an invalid context for just one command:

```bash
docker --context ark-context-that-does-not-exist ps
```

Confirm beforehand that no context of that name exists in `docker context ls`.
The command is supposed to fail. This is a local context-resolution error,
not evidence that the actual daemon stopped or that Python crashed.
Immediately retry normal `docker ps` to check the untouched working context.

## Case B: an executable that cannot start

```bash
docker run --name ark-runtime-missing --network none \
  --user 65534:65534 --cap-drop ALL \
  --security-opt no-new-privileges=true \
  --memory 32m --memory-swap 32m --pids-limit 16 \
  docker.io/library/alpine:3.22 /ark-no-such-program
```

Expect a nonzero command result and a runtime setup/start error. Inspect the
object with `docker inspect`, `docker ps -a` and `docker logs`. Don't assume a
particular final state string on every engine release; the important question
is whether the intended application executable ever ran.

## Case C: a program that reports its own failure

```bash
docker run --name ark-runtime-exit --network none \
  --user 65534:65534 --cap-drop ALL \
  --security-opt no-new-privileges=true \
  --memory 32m --memory-swap 32m --pids-limit 16 \
  docker.io/library/alpine:3.22 sh -c 'echo "ARK fixture: application validation failed" >&2; exit 23'
```

This command is also supposed to fail. Capture its exit status immediately with
`echo $?`, then inspect the object. Expect the fixture message in the logs and
`State.ExitCode` equal to 23. Unlike Case B, the application command executed
and chose its failure result.

## Write the diagnosis

For each case, give your colleague the failing layer, two observations and one
next action. Don't propose reinstalling Docker for a deliberately nonexistent
executable or restarting an engine for an application exit code.

<details>
<summary>I'm treating all three as "a stopped container"</summary>

Case A doesn't request a container at all. Case B can leave an engine object
without a successfully started application. Case C has application output and
a deliberately chosen exit code. Distinguish client, manager and process.

</details>

<details>
<summary>Which inspect fields help?</summary>

Read `State.Status`, `State.Error`, `State.ExitCode` and `State.Pid`, alongside
the original CLI error and logs. A field without context can be misleading:
PID 0 alone doesn't distinguish never-started from already-exited.

</details>

## Reset and transfer

```bash
docker rm ark-runtime-missing ark-runtime-exit
```

Remove only the objects you created; if an engine rejected creation entirely,
omit that nonexistent object from cleanup. No forced kill, image deletion or
global prune is needed.

Now return to the message service. If it runs but its HTTP port is wrong, which
of these layers are already known to have worked, and what new evidence do you
need? Explain your reasoning to a peer, or write a short incident note before
reopening module 01.
