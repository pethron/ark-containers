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
before trying it. We'll begin with `docker run`, then save the configuration in
Compose once we have a reason to do so.

## Before you start

Complete **one Docker setup** in the [installation chapter](02-installing-docker-and-containerd.md).
You need Docker, the downloaded course files, and a browser or `curl`. You do not
need Compose for the first result, nerdctl, a cloud account, or local Python.

Use Bash; on Windows with Docker Desktop, use your integrated WSL distribution.
In the rootful Linux lab, prefix each `docker` command below with `sudo`.

From the root of your course checkout, move into the supplied example:

```bash
cd 01-why-containers/first-app
```

All commands in this chapter run from that directory. If you have not downloaded
the course yet, use the Git or ZIP instructions in the installation chapter first.

## 1. Get a result

```bash
docker run -d --name ark-message \
  --user 65534:65534 \
  --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
  -p 127.0.0.1:8080:8000 \
  docker.io/library/python:3.12-alpine python -u /app/app.py
docker ps --filter name=ark-message
docker logs ark-message
```

Expect an image download on first launch. `ark-message`
should be running, and its logs should include:

```text
ARK message service listening on port 8000
```

Open `http://127.0.0.1:8080/` in your browser. You should see JSON with these fields:

```json
{"message": "Hello from ARK", "served_by": "<this container's hostname>"}
```

The hostname value will differ from the example. If the page is not ready yet,
wait a moment and retry; if it still fails, inspect
`docker ps -a --filter name=ark-message` and `docker logs ark-message` rather
than assuming it is still starting.

If you prefer a terminal check:

```bash
curl --fail --show-error --retry 5 --retry-all-errors --retry-delay 1 \
  --retry-max-time 15 --connect-timeout 2 --max-time 5 \
  http://127.0.0.1:8080/
```

Also visit `http://127.0.0.1:8080/health`. Its response should be:

```json
{"status": "ok"}
```

The bounded retries also cover a connection reset while the service starts;
they do not turn a persistent failure into success. `--retry-all-errors` needs
curl 7.71 or later. If your curl is older, use the browser check or retry the
bounded single-request command shown in the diagnostic section.

On Docker Desktop, the browser can run on your laptop. If the engine runs in a
separate VM or remote lab, run `curl` on that host: your laptop's loopback address
is not the VM's loopback address. An SSH tunnel is an alternative for browser
access; exposing the service to the whole network is not required.

## 2. Make it yours

Before changing anything, predict: does changing the message require a different
Python installation, a different image, or just a different application setting?

The first run used the application's default message. Stop and remove that
instance, then create another with a message supplied through `-e`:

```bash
docker stop ark-message
docker rm ark-message
docker run -d --name ark-message \
  --user 65534:65534 \
  --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
  -e MESSAGE="My first deployment" \
  -p 127.0.0.1:8080:8000 \
  docker.io/library/python:3.12-alpine python -u /app/app.py
```

Request the page again. The `message` field should now contain your text.
We recreated the container with a new environment; restarting the previous
instance would retain its original environment. The image did not need to change.

Use a message relevant to you: a course name, a project description, or the name
of a service you would actually want to deploy. You have the same supplied
application, but its result is now yours.

## 3. Explain just enough of the configuration

The launch command is provided so you can get a result first. Now that the
service works, here's enough to reason about its parts; you do not need to
memorize every flag:

| Setting | What it does here |
|---------|-------------------|
| `docker run` | Creates a container and starts its process |
| `-d`, `--name` | Runs it in the background and gives it a name |
| `python:3.12-alpine` | Selects the image providing Python and its userspace dependencies |
| `python -u /app/app.py` | Starts the supplied application process |
| `-e` | Gives that process its message setting |
| `--mount` | Makes your local `app.py` available read-only inside the container |
| `-p` | Connects a loopback host port to the application's container port |
| `--user` | Runs the application as an unprivileged user inside the container |

Beware, though, this is **not yet a packaged application image**. Python comes
from the image, but our application code comes from a file on your machine.
Send the whole example directory to your colleague, not just the image name.
We'll remove this shortcut when we build our own image in module 06.

## 4. Investigate a failure

Let's make a controlled mistake. Recreate the instance, but change the container
port in the launch command from `-p 127.0.0.1:8080:8000` to
`-p 127.0.0.1:8080:8001`. Keep every other option unchanged.

Before applying it, predict whether the application will stop, or keep running
but become unreachable through the published port. What would let you tell
those two possibilities apart?

```bash
docker stop ark-message
docker rm ark-message
```

Repeat the preceding `docker run` command with the changed port, then inspect
`docker ps -a --filter name=ark-message` and `docker logs ark-message`.

Try the page again. A request to `http://127.0.0.1:8080/` should now fail, even
though the process can still be running.

If using a terminal, keep the check bounded:

```bash
curl --fail --show-error --connect-timeout 2 --max-time 5 \
  http://127.0.0.1:8080/
```

This is an expected failure for the exercise, not a command that should silently
succeed. First write down what the service state and startup log tell you; then
use a hint if needed.

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

## 5. Try a variation without a recipe

A colleague needs their own copy on the same host, with a different message, while
your original service keeps working. Use the same image and source file to
create a second container, then decide which launch options must differ.

You know the outcome, but this time choose the changes yourself. Check that both
URLs return the intended messages and that a request appears in the logs of the
instance that handled it.

<details>
<summary>Hints if the two copies collide</summary>

Give the second container a different `--name`, such as `ark-second-message`.
Give it a different host port, such as 8081. The application's internal port can
stay at 8000, and the `MESSAGE` values can differ. Use `docker logs` with the
appropriate name to see which instance handled a request.

</details>

Changing ports by trial and error is not the goal. Explain why the two services
can share an internal port but cannot both publish the same host address and
port. Keep that question for the networking module.

## 6. Save the configuration when repeating it becomes tedious

You have now repeated a command and kept track of several options. What would
you give a colleague so they don't have to reconstruct those options from a chat?

This is the problem **Compose** helps with: store a service's launch configuration
in a file, then let a tool create it. It is not a new kind of container.

First stop and remove the two manually created instances. For the second one,
use the name you actually chose:

```bash
docker stop ark-message
docker rm ark-message
docker stop ark-second-message
docker rm ark-second-message
```

If you did not create the second instance, omit its commands. Don't remove a
container just because an example uses its name; inspect it first if in doubt.

Open the supplied `compose.yaml`. Match its image, command, environment, port,
user and mounted file to the options you have used. Predict its message before
running it.

If `docker compose version` succeeds, try:

```bash
docker compose up -d
docker compose ps
docker compose logs web
```

Check `/` and `/health` again. The supplied configuration returns `Hello from ARK`,
not the custom message from your removed instance. To change it, edit `MESSAGE`
in the file and run `docker compose up -d` again; `restart` alone does not apply
new environment settings.

The Compose plugin is included in Docker Desktop and in the recommended Linux
installation. If it is unavailable in your existing environment, the manual
experience is already complete; this comparison can wait until
[module 09](../09-compose/README.md). We will study Compose properly once we
need to coordinate more than one service.

## 7. Stop and reset only this exercise

If you tried Compose, from `first-app` run:

```bash
docker compose down
```

This removes this Compose project's containers and network. It does not remove
containers created with `docker run`; stop and remove any remaining named lab
instances separately using the preceding commands.

The downloaded image and your source files remain. This application has no
persistent data volumes. If you edited the Compose file, restore
`MESSAGE: "Hello from ARK"` and `127.0.0.1:8080:8000` to return to its baseline.
No global prune or Docker reset is needed.

## What did we just do?

You started a service from supplied material, checked its response, changed its
configuration, and used evidence to repair a failed connection. You also adapted
the setup to a second instance instead of only repeating the original commands.

Before reading on, answer these without looking back:

- Which part supplied Python, and which part supplied the application code?
- Did a different message require a different image?
- Which observation distinguished a stopped application from a wrong port mapping?
- What remains on your machine after removing the container?
- Which repeated work did the Compose file replace, without changing the application?

Discuss one answer with a peer if you can. Working alone? Write your explanation,
then check it against the configuration and your observations.

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

## Optional: run the application through containerd

<details>
<summary>Same application, a second runtime path</summary>

Do this later if you want to compare clients. It is not required for the first
experience. Use the Linux lab and complete the optional nerdctl installation
first; don't modify Docker Desktop's internal runtime.

Stop the Docker example so port 8080 is free. From the original `first-app`
directory, with its `app.py` present:

```bash
sudo nerdctl --address /run/containerd/containerd.sock \
  --namespace ark-lab run -d --name ark-message \
  --user 65534:65534 \
  --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
  -e MESSAGE="Hello from containerd" \
  -p 127.0.0.1:8080:8000 \
  docker.io/library/python:3.12-alpine python -u /app/app.py
```

Check `http://127.0.0.1:8080/` and `/health` from the Linux runtime host. The
message should now be `Hello from containerd`; the HTTP contract is unchanged.
Use the same bounded request check from the first section if startup takes a
moment.

```bash
sudo nerdctl --address /run/containerd/containerd.sock \
  --namespace ark-lab ps -a
sudo nerdctl --address /run/containerd/containerd.sock \
  --namespace ark-lab logs ark-message
```

The client talks to containerd directly. It may download its own copy of the
image; Docker and nerdctl do not promise a shared visible catalog.

When finished:

```bash
sudo nerdctl --address /run/containerd/containerd.sock \
  --namespace ark-lab stop ark-message
sudo nerdctl --address /run/containerd/containerd.sock \
  --namespace ark-lab rm ark-message
```

Only the named instance is removed. Cached images and containerd's lab network
configuration remain. We'll unpack the runtime differences in module 03.

</details>
