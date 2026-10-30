---
title: "Commands, entrypoints and stop signals"
track: architecture
---

# Commands, entrypoints and stop signals

The message service's recipe starts the service without a command after the
image name. Suppose your colleague wants to check the Python version instead,
or stop the service while it is handling work. Both requests depend on how
the image starts its process, so let's follow the command from build time
to shutdown.

## One instruction runs now, two record a later start

The previous chapter leaves the terminal in your own build directory. Return
to the supplied `message-service` so we can use its original recipe again:

=== "Linux (Bash)"

    ```bash
    cd ../message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location ..\message-service
    ```

Build the supplied recipe, which copies `app.py` into the image, runs it as
the `ark` user and records `python /app/app.py` as its default command:

```text
docker build -t ark-message:first-build .
```

`RUN adduser -D ark` executes during construction. It leaves the image with an
account in its user database, then finishes. Starting a container from that
image uses the resulting files; it doesn't rerun `adduser`.

`CMD` records a default for container creation. Our original recipe has no
application entrypoint, so the words after the image name replace that whole
default. Ask the image you just built for another command:

```text
docker run --rm ark-message:first-build python --version
```

You should see a Python version and no running service. `--rm` removes this
one-off container after it finishes; the image stays available.

An **entrypoint** records the executable part of the launch. Open
`Dockerfile.exec`: its final two lines are:

```dockerfile
ENTRYPOINT ["python"]
CMD ["/app/signal-server.py"]
```

Docker combines those arrays into `python /app/signal-server.py`. Arguments
after the image name replace `CMD` while leaving the entrypoint, so `--version`
becomes an argument to Python:

```text
docker build -f Dockerfile.exec -t ark-message:exec .
docker run --rm ark-message:exec --version
docker run --rm --entrypoint sh ark-message:exec -c "whoami"
```

The last command explicitly replaces the entrypoint with `sh`; the arguments
after the image tell that shell to run `whoami`. Expect `ark`. Choosing an
entrypoint is useful when your image behaves like one executable, while a
complete `CMD` is convenient for a service whose diagnostic command people
may replace. Both designs are valid; document the one your users will meet.

## Follow the process that receives stop

When you ask Docker to stop a container, it sends a stop signal to the
container's main process, waits for a grace period of ten seconds by default,
then forces the process to end. Our original service has no shutdown handler,
so until now it has simply used up that grace period. Putting the same Python
command in an array doesn't add one: the application must also decide what to
do when it receives a signal.

The supplied `signal-server.py` reuses the original HTTP handler and adds
handlers for TERM and INT. A **signal** is an operating-system notification
to a process; Docker normally sends TERM to the container's main process
when you request a stop. This example logs that notification and exits,
closing its listening socket. It is a small signal demonstration, not a
guarantee that every in-flight request has been drained.

With the exec recipe, Python becomes PID 1 directly. Build the deliberately
indirect variant too:

```text
docker build -f Dockerfile.shell -t ark-message:shell .
```

Read its last lines before launching:

```dockerfile
ENTRYPOINT ["sh", "-c"]
CMD ["python /app/signal-server.py & wait"]
```

Here `sh -c` interprets a command string. The `&` starts Python in the
background and `wait` keeps the shell waiting for it, so the shell remains
PID 1. This deliberate wrapper makes the extra process visible; some simpler
shell commands may be optimized by replacing the shell with their executable.

Ensure both names and ports below are free, then launch:

```text
docker run -d --name ark-exec -p 127.0.0.1:8080:8000 ark-message:exec
docker run -d --name ark-shell -p 127.0.0.1:8081:8000 ark-message:shell
```

Check `/health` in your browser on both local ports. Retry after startup if
necessary, then inspect logs if failure persists. Compare the process listings:

```text
docker exec ark-exec ps
docker exec ark-shell ps
```

In `ark-exec`, Python is PID 1. In `ark-shell`, PID 1 is the shell and Python
is its child. Predict which Python process will receive Docker's TERM directly,
then stop both. `--timeout 2` gives each container two seconds before Docker
forces termination, keeping this deliberate fault bounded:

```text
docker stop --timeout 2 ark-exec ark-shell
docker logs ark-exec
docker logs ark-shell
```

The direct service should log `received signal 15; closing listener`, where
15 identifies TERM on this Linux platform. The indirect one won't log that
message: this wrapper doesn't forward TERM to its child, so Python never
hears about the stop and Docker forces the container to end after two seconds.

## When a shell is part of the job

The JSON-array form, often called **exec form**, passes arguments directly.
It doesn't expand `$MESSAGE`, run pipelines or interpret shell operators.
The shell form, such as `CMD python /app/signal-server.py`, requests a shell
to interpret that string, bringing its quoting and process behavior with it.
Those are separate choices from which host terminal you use.

A shell wrapper can be useful for startup preparation. Its last action should
usually be `exec python /app/signal-server.py`, which replaces the shell with
Python rather than keeping it as a parent, so Python receives the stop signal
itself. For our single service, the direct array is the simpler choice.

Before leaving, explain why replacing `CMD` changes a one-off command,
whereas putting a new `RUN` in the Dockerfile changes the next build. Then
remove the experiment:

```text
docker rm ark-exec ark-shell
docker image rm ark-message:first-build ark-message:exec ark-message:shell
```

The supplied original recipe and signal examples remain unchanged on disk.
The [Dockerfile reference](https://docs.docker.com/reference/dockerfile/#understand-how-cmd-and-entrypoint-interact)
has the complete command-combination rules. Next we'll use build-time commands
to [add a dependency while keeping its installation cached](05-dependencies-and-build-cache.md).
