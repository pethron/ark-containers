---
title: "Your first application"
track: runbook
---

# Your first application

You need to hand a colleague a small HTTP service. They should be able to start
it, choose the message it returns, and tell whether it is working, without
installing Python on their laptop.

We'll do that now, then change the configuration and investigate a connection
failure. The code is supplied: you do not need to write Python or build an image
before trying it. We'll use `docker run` throughout this exercise; saving a
multi-service configuration in Compose comes later in the course.

## Before you start

Complete **one Docker setup** in the [installation chapter](02-installing-docker.md).
You need Docker, the downloaded course files, and a browser or `curl`. You do not
need Compose, a cloud account, or local Python. The image we download already
contains Python; Docker runs that interpreter inside the container.

Choose **Linux (Bash)** or **Windows (PowerShell)** in the command tabs.
Use PowerShell 7 on Windows with Docker Desktop running Linux containers.
On Linux Engine, prefix Docker commands with `sudo` if required by your setup,
as explained in the installation chapter.

From the root of your course checkout, move into the supplied example:

=== "Linux (Bash)"

    ```bash
    cd 01-why-containers/first-app
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\01-why-containers\first-app
    ```

All commands in this chapter run from that directory. If you have not downloaded
the course yet, use the Git or ZIP instructions in the installation chapter first.

## 1. Start the application

Here's what we're asking Docker to do: start the supplied service using Python
from an existing image, let it read our local `app.py` without changing that
file, and make it reachable only from this machine at `http://127.0.0.1:8080/`.
The image supplies the runtime, not our source code; keep `app.py` in this
directory. The command doesn't install Python on your laptop.

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-message \
      --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
      -p 127.0.0.1:8080:8000 \
      python:3.12-alpine python /app/app.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-message `
      --mount "type=bind,source=$($PWD.Path)\app.py,target=/app/app.py,readonly" `
      -p 127.0.0.1:8080:8000 `
      python:3.12-alpine python /app/app.py
    ```

Docker prints the new container's identifier. On the first run, it also
downloads the Python image. That identifier is not proof that the service
can answer a request; let's try it.

Open `http://127.0.0.1:8080/` in your browser. You should see JSON with these fields:

```json
{"message": "Hello from ARK", "served_by": "<this container's hostname>"}
```

The hostname value will differ from the example. You've now reached a Python
service without installing Python locally. If the page is not ready yet, wait
a moment and retry. If it still fails, use the process and log checks below
before continuing.

Also visit `http://127.0.0.1:8080/health`. Its response should be:

```json
{"status": "ok"}
```

This is a route supplied by our application, not an automatic Docker check.
It gives us a simple response to verify when we change the service later.

??? note "Prefer a terminal check? Use curl"

    ```text
    curl http://127.0.0.1:8080/
    ```

    If the service is still starting, wait a moment and try again.
    Replace the final URL with `http://127.0.0.1:8080/health` to check that route.

??? note "Using a remote Docker engine?"

    On Docker Desktop, the browser can run on your laptop. With a remote engine
    or a separate Linux VM, `127.0.0.1` refers to that Docker host, not your
    laptop. Run the terminal check on that host or use an SSH tunnel to reach
    it from your browser. You don't need to publish the port to the whole network.

### Is the process still running?

The page shows the service can respond. Now let's see what Docker can tell us
about the process behind it:

```text
docker ps --filter name=ark-message
```

Look for `ark-message` with an `Up` status. `docker ps` lists running
containers; the filter narrows the list to names containing `ark-message`.
An `Up` status tells us the main process is running, not that it can answer HTTP.
If the row is missing, include stopped containers with:

```text
docker ps -a --filter name=ark-message
```

Here `-a` means all states. If the service has exited, the next check helps us
find out why.

### What does the application say?

Read the output written by our application, even if the container has stopped:

```text
docker logs ark-message
```

You should find this startup message, followed by any requests you've made:

```text
ARK message service listening on port 8000
```

That's the application's own message, not Docker's assessment of its health.
Notice port 8000: it differs from the 8080 in our browser URL. We'll connect
those two numbers when we read the launch command below. If you see an error
instead, investigate it before changing the service.

## 2. Read the launch command

That was quite a few options for one small application, right? Now that you've
seen it work, let's unpack them. There's no need to memorize the whole command.

| Setting | What it does here |
|---------|-------------------|
| `docker run` | Creates a container and starts its process |
| `-d`, `--name` | Runs it in the background and gives it a name |
| `python:3.12-alpine` | Selects the image providing Python and its dependencies |
| `python /app/app.py` | Runs the supplied script |
| `--mount` | Makes your local `app.py` available read-only inside the container |
| `-p` | Connects a loopback host port to the application's container port |

`--mount` connects a file on your machine to a path inside the container. This
is called a bind mount; `readonly` lets the application read that file but not
change it through the mount. `$(pwd)` in Bash and `$($PWD.Path)` in PowerShell
insert your current directory into the source path, so Docker can find `app.py`.
The target `/app/app.py` stays a Linux path in both versions because the
container runs Linux.

In `-p 127.0.0.1:8080:8000`, the first address is loopback: the service is
reachable from the Docker host, not published to your whole network. Port
8080 is the host's entry point, while port 8000 is where the application
listens inside the container. A port lets the operating system direct a
network connection to the right service. `-d` leaves the service running in
the background; `docker logs` lets us read its output.

This is a local learning setup, not a production template. We're using the
image's default user, which is root in this Python image. Module 04 will give
our own image an application user; module 08 will explain runtime hardening.

Beware, though, this is **not yet a packaged application image**. Python comes
from the image, but our application code comes from a file on your machine.
Send the whole example directory to your colleague, not just the image name.
We'll remove this shortcut when we build our own image in module 04.

Before changing the service, find the part of the command that selects the
host port and the part that supplies the source file. Explain each in your
own words. You can refer to the
table; the point is to know which setting to investigate, not memorize flags.

## 3. Make it yours

Before changing anything, predict: does changing the message require a different
Python installation, a different image, or just a different application setting?

We'll add one setting: `-e MESSAGE="My first deployment"`. `-e` supplies an
environment variable, a named value our application reads when it starts.
Keep the image, mount, user and ports unchanged.

First stop the running instance, then remove its container:

```text
docker stop ark-message
docker rm ark-message
```

Removing this container doesn't delete our source file or the downloaded image.
Now create its replacement with the message setting:

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-message \
      --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
      -e MESSAGE="My first deployment" \
      -p 127.0.0.1:8080:8000 \
      python:3.12-alpine python /app/app.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-message `
      --mount "type=bind,source=$($PWD.Path)\app.py,target=/app/app.py,readonly" `
      -e MESSAGE="My first deployment" `
      -p 127.0.0.1:8080:8000 `
      python:3.12-alpine python /app/app.py
    ```

Request the page again. The `message` field should now contain your text.
We recreated the container with a new environment; restarting the previous
instance would retain its original environment. The image did not need to change.

Try a course name, a project description, or whatever you want your colleague
to see. The application stays the same; we're changing what we ask it to do.

## 4. It's running, but I can't reach it

Let's make a controlled mistake. Recreate the instance, but change the container
port in the launch command from `-p 127.0.0.1:8080:8000` to
`-p 127.0.0.1:8080:8001`. Keep every other option unchanged.

Before applying it, predict whether the application will stop, or keep running
but become unreachable through the published port. What would let you tell
those two possibilities apart?

```text
docker stop ark-message
docker rm ark-message
```

Repeat the preceding `docker run` command with the changed port, then inspect
`docker ps -a --filter name=ark-message` and `docker logs ark-message`.

Try the page again. A request to `http://127.0.0.1:8080/` should now fail, even
though the process can still be running.

If using a terminal, keep the check bounded:

=== "Linux (Bash)"

    ```bash
    curl --fail --show-error --connect-timeout 2 --max-time 5 \
      http://127.0.0.1:8080/
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe --fail --show-error --connect-timeout 2 --max-time 5 `
      http://127.0.0.1:8080/
    ```

This request is supposed to fail. But did the application stop? Look at the
container state and its startup log before opening the hints: they give us two
different pieces of the answer.

<details>
<summary>Hint 1: distinguish the two ports</summary>

The host receives the request on port 8080. Which container port does the new
configuration forward it to, and which port does the startup log say is listening?

</details>

<details>
<summary>Hint 2: restore the connection</summary>

The application still listens on port 8000. Restore the mapping to
`127.0.0.1:8080:8000` when recreating the instance, and check the response again.
You do not need to reinstall Docker or disable the firewall.

</details>

Once it works, explain why "the container is running" was not enough evidence
that a user could reach the service. We will revisit this distinction when we
study networking and health checks.

## 5. A second copy for your colleague

A colleague needs their own copy on the same host, with a different message, while
your original service keeps working. Use the same image and source file to
create a second container, then decide which launch options must differ.

This time, try choosing the options yourself. You should be able to visit both
URLs and see different messages; check each container's logs to see where the
requests arrived.

<details>
<summary>Hints if the two copies collide</summary>

Give the second container a different `--name`, such as `ark-second-message`.
Give it a different host port, such as 8081. The application's internal port can
stay at 8000, and the `MESSAGE` values can differ. Use `docker logs` with the
appropriate name to see which instance handled a request.

</details>

Notice that both applications can still listen on port 8000 inside their
containers. Why did we need a different port on the host, then? We'll follow
that connection properly in the networking module.

## 6. Clean up

Stop and remove the two manually created instances. For the second one, use the
name you actually chose:

```text
docker stop ark-message
docker rm ark-message
docker stop ark-second-message
docker rm ark-second-message
```

If you did not create the second instance, omit its commands. Don't remove a
container just because an example uses its name; inspect it first if in doubt.

The downloaded image and your source files remain. This application has no
persistent data volumes. No global prune or Docker reset is needed. We have
repeated quite a few launch options; in module 07 we'll give that repetition a
home in a Compose file, once there is more than one service to coordinate.

## What did we just do?

So, to sum up: you ran an application without installing Python, changed its
message without changing the image, and fixed a connection that was pointing to
the wrong port. You also ran a second copy alongside the first one.

Before reading on, answer these without looking back:

- Which part supplied Python, and which part supplied the application code?
- Did a different message require a different image?
- Which observation distinguished a stopped application from a wrong port mapping?
- What remains on your machine after removing the container?
- What would your colleague need besides the image name to run this example?

If you're working with someone, compare your explanations. If not, try answering
before looking back at the commands: the interesting part is why they worked.

For a less-guided attempt, try the [handover kata](katas/README.md).
Next, the [history of physical servers and VMs](04-from-physical-servers-to-virtual-machines.md)
will put this experience into context. At the end of the module, we'll return to
the two instances and ask what they really isolate.

## If something else fails

| Symptom | Next useful evidence |
|---------|----------------------|
| Docker cannot reach its server | Return to the installation checks |
| Image download fails | Read the registry error: connectivity, proxy settings, rate limits, and platform support are different causes |
| A container name is already in use | Inspect that named instance before deciding whether to reuse or remove it |
| Service exits before responding | Inspect `docker ps -a` and `docker logs` for your instance; check that `app.py` is present and readable |
| Mount source does not exist | Check your current directory: `app.py` must be there when you run the command |
| Host port 8080 is already allocated | Use a free loopback host port, update the URL, and keep the container-side port at 8000 |
| Unknown URL returns 404 | Try `/` or `/health`; an HTTP response is different evidence from a connection failure |
