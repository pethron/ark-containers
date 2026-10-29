# An application that handles shutdown

The [module-02 service](../../../02-running-containers/01-pick-up-the-service.md)
uses the original application without a custom shutdown handler. This optional
experiment adds that behavior so you can compare a handled stop request with
one the application deliberately ignores. It is not required for the core
lifecycle exercises.

[operations.py](operations.py) loads the original HTTP handler from
[app.py](../../../01-why-containers/first-app/app.py), then runs the server in
a thread while the main thread waits for a signal. A handled request wakes
the main thread, which shuts down the server and writes a final log entry.
This is teaching code, not a production server or a guarantee of transaction
draining.

## Why kill 1 doesn't always stop the container

The lifecycle rule says that a container stops when its main process exits.
It doesn't say that every signal will make that process exit. Linux gives
PID 1, the init process of a PID namespace, special treatment: signals without
a registered handler don't get the ordinary default termination behavior.

To see this with the unchanged application, use the
[module-02 launch](../../../02-running-containers/01-pick-up-the-service.md#start-from-a-known-result),
but choose the unused name `ark-pid-signals` and a free loopback port such as
8084. Keep this separate from any service you're currently studying. From
your host terminal, open a shell:

```text
docker exec -it ark-pid-signals sh
```

Inside that shell, use `ps` to confirm that `python /app/app.py` is PID 1.
Before each command, predict whether the service and your shell will end:

```sh
kill 1
```

Without an explicit signal, `kill` sends `SIGTERM`. This application hasn't
registered a handler for it, so Python remains alive as PID 1. Check with
`ps` and a browser request rather than treating a command returning without
an error as proof that it terminated the target.

Even a stronger-looking command isn't a way around this from a process
inside the same PID namespace:

```sh
kill -KILL 1
```

Linux also protects the namespace's init process from that internally sent
signal. However, Python does register a handler for `SIGINT`, normally used
for an interrupt. Try it from the shell:

```sh
kill -INT 1
```

For this unchanged application, Python raises `KeyboardInterrupt`, which
isn't caught by the application, and exits. The container stops and your
extra shell ends too. Back at the host, read `docker logs ark-pid-signals`
to find the traceback and check its state with `docker ps -a`.
This is an interrupted application, not our custom clean-shutdown procedure.

The outcome depends on the program's registered handlers; `SIGINT` is not a
universal way to stop PID 1. Docker can also send a forced kill from outside
the container's PID namespace, where a different rule applies. Restart the
same test container, then run these commands **from the host**:

```text
docker start ark-pid-signals
docker kill ark-pid-signals
docker ps -a
docker rm ark-pid-signals
```

`docker kill` uses `SIGKILL` by default, terminating the main process without
giving it an opportunity to handle the signal. Unlike the internally sent
`kill -KILL 1`, it can force this namespace's init process to end.
Keep that distinction separate from the lifecycle rule: in every case where
the main process actually exits, the container's execution ends.

## Run the handled-shutdown experiment

Open a terminal at the course repository root, containing `01-why-containers`
and `advanced`. Check that `ark-shutdown` and loopback port 8083 are free.
The mount below exposes that checkout read-only at `/course` so the wrapper
can locate the shared application; don't mount a parent with private files.

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-shutdown \
      --mount "type=bind,source=$(pwd),target=/course,readonly" \
      -p 127.0.0.1:8083:8000 \
      python:3.12-alpine python /course/advanced/linux-primitives/shutdown-service/operations.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-shutdown `
      --mount "type=bind,source=$($PWD.Path),target=/course,readonly" `
      -p 127.0.0.1:8083:8000 `
      python:3.12-alpine python /course/advanced/linux-primitives/shutdown-service/operations.py
    ```

Check `http://127.0.0.1:8083/health`, then stop and read the log:

```text
docker stop ark-shutdown
docker logs ark-shutdown
docker rm ark-shutdown
```

In the default `SHUTDOWN_MODE=graceful`, expect a shutdown-request message
and `clean shutdown complete`. Repeat the launch with
`-e SHUTDOWN_MODE=ignore` before the image name, then stop with
`docker stop --timeout 2 ark-shutdown`. The application logs that it ignored
the request; Docker forces termination after the waiting period, without
a completion message. Remove the stopped instance when finished.

Any other mode, such as `-e SHUTDOWN_MODE=gracefull`, produces an explicit
configuration error before opening the HTTP port. Restarting that instance
repeats the error because it keeps the same configuration. Read its log
before removing it and launching a corrected replacement.

The [process explanation](../01-a-container-is-just-a-process.md) and
[runtime supervision](../../runtime-architecture/02-containerd-and-the-shim.md)
provide the underlying context. Module 09 revisits the operational implications
for recovery and work in progress.
