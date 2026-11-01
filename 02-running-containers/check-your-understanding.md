---
title: "Check your understanding"
track: kata
---

# Check your understanding

Every experiment in this module asked the same question in a different form:
when you act on `ark-ops`, which parts of it survive? Before opening an answer,
commit to your own prediction, even a rough one. The answers aren't graded, and
a prediction that misses tells you exactly which chapter to reopen.

## 1. Looking back: what "Up" tells you

In the first module, a service could show `Up` in `docker ps` while the browser
failed to load its page. Recall the three checks we used on a running service.
What does each one tell you, and which of them would you trust to say that a
user can actually reach the page?

<details>
<summary>Answer</summary>

`docker ps` tells you the container's main process is running, `docker logs`
tells you what the application itself reported, and an HTTP request tells you
whether the service answers the way a user would experience it. Only the HTTP
check speaks for the user: a process can be running and still be unreachable,
as a wrong port mapping showed. Keeping the three apart is useful in this
module too, because stopping, starting and replacing a container change them
in different ways. See
[What does the application say?](../01-why-containers/03-your-first-application.md#what-does-the-application-say)

</details>

## 2. Two shells, one server

You have a shell open in `ark-ops` with `docker exec -it ark-ops sh`. First you
type `exit`, then refresh the page. Later you open a new shell, leave it at its
prompt and run `docker stop ark-ops` from a second host terminal. Predict what
happens to the page in the first case and to the waiting shell in the second.

<details>
<summary>Answer</summary>

After `exit` the page keeps answering, because you ended the extra shell and
the Python server is a separate process. With `docker stop`, the waiting shell
ends too, even though you never typed `exit` in it. The container's execution
follows its main process, PID 1, which here is the Python server started by our
launch command. When that process exits, Docker terminates the remaining
processes, so an open shell can't keep the container alive on its own. See
[Which process keeps the container alive?](02-inside-the-running-container.md#which-process-keeps-the-container-alive)

</details>

## 3. A job that stopped

A classmate runs the course image to check its Python version and then lists all
containers. They're worried that something went wrong:

```text
docker ps -a
CONTAINER ID   IMAGE                           COMMAND              CREATED         STATUS                     PORTS     NAMES
9b1e0c7a2f5d   ghcr.io/pethron/ark-message:1   "python --version"   5 seconds ago   Exited (0) 4 seconds ago             ark-once
```

Did the container fail? What would you show them to check what it produced?

<details>
<summary>Answer</summary>

It finished its job. The main process was `python --version`, which prints the
version and ends, and the container's execution ends with it. The `0` in
`Exited (0)` conventionally means successful completion, which is exactly what
we wanted from a one-off command. Because the container wasn't removed,
`docker logs ark-once` still shows the version it printed, and
`docker rm ark-once` cleans it up afterwards. See
[A process can finish without failing](02-inside-the-running-container.md#a-process-can-finish-without-failing).

</details>

## 4. Where did the note go?

A colleague wrote `/tmp/ark-note` inside `ark-ops` yesterday. Today they tell
you "I restarted the service and my note is gone", and
`docker exec ark-ops cat /tmp/ark-note` reports `No such file or directory`.
The name is still `ark-ops`.
What did they most likely do, and what else would you expect to have changed?

<details>
<summary>Answer</summary>

They most likely removed the container and ran a new one with the same name.
`docker restart`, or a stop followed by `docker start`, keeps the same container
with its writable filesystem, so the note would still be there. A replacement
gets a fresh writable filesystem from the image, and reusing the name doesn't
bring back the old instance's files. If they changed a setting while
recreating it, such as the message, the page would show that new value too.
See [Replace the configuration](03-restarting-isnt-replacing.md#replace-the-configuration).

</details>

## 5. The message that won't change

The team wants the page to say `Maintenance at 17:00`. Someone runs
`docker restart ark-ops`, but the page still shows the old message. Why didn't
it work, and what would you do instead?

<details>
<summary>Answer</summary>

`docker restart` stops and starts the same container with the settings it
already has, and our application reads `MESSAGE` only when it starts. Since
nobody gave Docker a new value, the restarted process reads the old one again.
To change the setting, stop and remove `ark-ops`, then run a replacement with
the same launch options and `-e MESSAGE="Maintenance at 17:00"`. Keep that
launch command in your notes, so the next person can repeat the change without
guessing what was typed. See
[Replace the configuration](03-restarting-isnt-replacing.md#replace-the-configuration).

</details>

## 6. Ten seconds of waiting

Every time you run `docker stop ark-ops`, the command takes about ten seconds
to return, and the log never shows a shutdown message. Explain what Docker is
doing during that pause. Is the delay a sign that something is broken?

<details>
<summary>Answer</summary>

Docker sends `SIGTERM` to the main process to ask it to finish, then waits.
Our application has no handler for that request, and as PID 1 in this image it
keeps running, so Docker waits out the default ten seconds and then uses
`SIGKILL` to force it to end. Nothing is broken for a message page, and the
missing shutdown message is expected because the application never writes one.
The pause does tell you something useful: being stopped doesn't prove that the
application finished whatever it was doing. See
[What Docker waits for](04-stopping-a-service.md#what-docker-waits-for).

</details>

## 7. Stop first, or force it?

Suppose the container runs a worker that processes uploads, and you need to
replace it with a new configuration. You could run `docker rm -f` on it
straight away, or stop it, check its state and logs, and then remove it. Which
would you choose, and when might the shortcut be acceptable?

<details>
<summary>Answer</summary>

For a worker that may be in the middle of an upload, I'd stop it first.
`docker stop` gives the main process a termination request and a waiting
period, while `docker rm -f` can kill running work without that chance.
Checking `docker ps -a` and the logs before removing the container also keeps
the evidence available if something went wrong. The shortcut is harder to
justify here; it's more reasonable for an instance you know is doing no
useful work, such as a broken experiment you've already investigated. See
[Stop first, remove when ready](04-stopping-a-service.md#stop-first-remove-when-ready).

</details>

## 8. Which machine owns the PID?

On Docker Desktop for Windows, `docker top` reports a PID that you can't find
in Windows Task Manager. Where should you look for the process, and which
part of Docker received the command that started it?

<details>
<summary>Answer</summary>

The Docker client sent a request to the engine. The reported PID belongs to
the Linux environment where that engine runs, which Docker Desktop manages;
it is not a Windows process ID. On a native Linux Engine the corresponding
host is the Linux machine running that engine. See
[Find the engine](06-from-docker-run-to-a-process.md#find-the-engine).

</details>

## 9. Two kinds of boundary

Two containers have different PID namespaces. Does that place a memory limit
on either one? What evidence would you use to check a requested limit?

<details>
<summary>Answer</summary>

The PID namespaces give processes separate views and numbering; they don't
set memory budgets. Docker can request a cgroup memory limit when the
container is created. Inspect its configuration and, when supported, the
corresponding cgroup control; check engine warnings before concluding the
limit is enforced. See
[Read a resource boundary](07-namespaces-and-cgroups.md#read-a-resource-boundary).

</details>

If you can explain these to someone else, try the
[service-change kata](katas/README.md), where you plan the whole sequence and
write it down for the next person.
