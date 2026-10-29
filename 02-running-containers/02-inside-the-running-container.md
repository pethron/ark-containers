---
title: "Inside the running container"
track: architecture
---

# Inside the running container

So far you've watched the service from the outside: a page in the browser,
a container in Docker's listing and some application logs. That's enough to
check whether it answers, but it doesn't yet explain what is keeping it alive.
Let's open a shell alongside the server and use it to explore the relationship
between the container, its processes and its files.

## Open a shell alongside the server

Continue with the running `ark-ops` from the previous chapter. From your host
terminal, ask Docker to start a shell in that container:

```text
docker exec -it ark-ops sh
```

`docker exec` starts an additional process in a running container; here that
process is `sh`, a shell included in our image. The `-i` keeps its input open,
and `-t` gives it a terminal so you can work interactively. People often call
this "logging into the container", but there is no SSH server or remote login
involved: Docker starts the shell directly, without replacing the HTTP server.

The prompt you now see belongs to that shell. The following commands run
**inside the Linux container**, including when you opened it from PowerShell:

```sh
hostname
pwd
ls /app
ps
```

The hostname identifies this instance, while `pwd` shows the shell's current
directory, normally `/` for this image. Under `/app` you'll recognize `app.py`,
the file we mounted rather than a second copy installed by Docker. Finally,
`ps` lists the processes visible inside the container: look for the Python
server and your `sh`. You'll also see the short-lived `ps` command itself.

Notice the `PID` column, which gives each process a numeric identifier.
The Python command that runs `/app/app.py` has PID 1 here: it is the
**main process**, started by our launch command. Your shell has another PID
because it was added later. Keep that distinction in mind as we try closing
one without closing the other.

First, leave a note that we can find again. Still inside the shell, run:

```sh
echo temporary-instance-state > /tmp/ark-note
cat /tmp/ark-note
```

You should read back `temporary-instance-state`. We chose `/tmp/ark-note`
because it is outside the read-only application mount: this file belongs to the
container's writable filesystem, not to the source file on your computer.
Before leaving, predict whether ending this shell will stop the page too.
Then run:

```sh
exit
```

You're back at your host prompt. Refresh `http://127.0.0.1:8082/` and check
`docker ps -a`: the service is still running because the process you ended
was the extra shell, not the Python server. Opening and closing a shell is
therefore useful for inspection without restarting the application.

## Which process keeps the container alive?

Let's try the other side of that boundary. In your first host terminal, open
the shell again and leave it waiting at its prompt:

```text
docker exec -it ark-ops sh
```

Now open a **second host terminal**. Before executing the next command,
predict what will happen to the shell in the first terminal: can it keep
running after the server stops?

```text
docker stop ark-ops
```

The stop may take around ten seconds with this application; wait for Docker
to return before continuing. We'll explain that waiting period in the
[stop chapter](04-stopping-a-service.md).

??? note "Why not use kill from inside the shell?"

    The container stops when its main process exits, but sending that process
    a signal doesn't always make it exit. PID 1 has special signal behavior
    on Linux, so for this exercise use `docker stop` from the host. The
    [optional signal experiment](../advanced/linux-primitives/shutdown-service/README.md#why-kill-1-doesnt-always-stop-the-container)
    compares the cases without changing the lifecycle model.

Return to the first terminal. The shell session ends too, although you never
typed `exit` in it; press Enter if necessary to make the returned host prompt
visible. When the main process exits, the container's execution ends and its
remaining processes are terminated. An extra shell doesn't keep the container
alive independently of the server.

From a host prompt, try to open another session before starting the service:

```text
docker exec -it ark-ops sh
```

Docker should report that the container is not running. That error is expected:
`exec` adds a process to a running container, whereas `docker start` starts
the main process of an existing stopped container. Use the latter now, then
open a fresh shell:

```text
docker start ark-ops
docker exec -it ark-ops sh
```

Inside that shell, check the note and the process list:

```sh
cat /tmp/ark-note
ps
exit
```

The note remains even though neither the old server process nor the old shell
survived. Docker kept the stopped container's name, settings and writable
files, then used them to start execution again. This is the distinction we
need for the next change: **stopping execution isn't deleting the container**.

An image supplies the starting files and defaults; the container adds its own
configuration and writable filesystem. Its processes use those files while
they run, but their in-memory work is lost when they end. Finding the note
after a start doesn't mean an unfinished HTTP request also continued where
it left off.

## A process can finish without failing

Our server waits for requests, so it is supposed to keep running. Not every
container has that job, though: imagine using the same Python image simply
to check which version it contains. Check that `ark-once` is a free name,
then run these commands from a host terminal:

```text
docker run --name ark-once python:3.12-alpine python --version
docker ps -a
docker logs ark-once
```

Python prints its version and finishes, leaving `ark-once` as `Exited (0)`.
Zero conventionally means successful completion; in this case, stopping is
exactly the result we wanted. The same lifetime rule applies to both examples:
the version command finishes quickly, while the HTTP server keeps waiting
for work. Neither needs an open shell session to stay alive.

You can remove the completed job now:

```text
docker rm ark-once
```

You'll often see `--rm` on short jobs to remove them automatically when they
finish. We left it out so you could inspect the result, just as keeping a
failed service around gives you time to read its logs. Leave `ark-ops`
running, with its note, for
[the replacement experiment](03-restarting-isnt-replacing.md). If pausing instead,
stop it and start it again later; don't remove it yet.
