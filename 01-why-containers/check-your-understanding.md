---
title: "Check your understanding"
track: kata
---

# Check your understanding

Your colleague now has a way to run the message service without installing
Python, and you've seen it answer, break and run twice on the same machine.
Try each question from memory before opening its answer. Nobody is keeping
score here: if your guess turns out wrong, the link at the end of the answer
points to the chapter worth rereading.

## 1. Two numbers in one port mapping

The service was started with `-p 127.0.0.1:8080:8000`, and the log says it
listens on port 8000. Out of curiosity, you open `http://127.0.0.1:8000/` in
the browser on the same machine. What do you expect to happen, and why does
`http://127.0.0.1:8080/` behave differently?

<details>
<summary>Answer</summary>

The request to port 8000 should fail to connect, unless some other program on
your machine happens to use that port. Port 8000 is where the application
listens inside the container, while 8080 is the entry point we asked Docker to
open on the host. Docker forwards connections arriving at `127.0.0.1:8080` to
port 8000 in the container, and nothing forwards host port 8000 anywhere. The
two numbers belong to different places, which is why the log and the browser
URL disagree without anything being wrong. See
[Read the launch command](04-make-it-yours.md#read-the-launch-command).

</details>

## 2. Up, but silent

After recreating `ark-message`, the browser can't load
`http://127.0.0.1:8080/`. You check the container and its log:

```text
docker ps --filter name=ark-message
CONTAINER ID   IMAGE                           COMMAND                CREATED          STATUS          PORTS                      NAMES
3f2a9c1b7d4e   ghcr.io/pethron/ark-message:1   "python /app/app.py"   20 seconds ago   Up 19 seconds   127.0.0.1:8080->8001/tcp   ark-message

docker logs ark-message
ARK message service listening on port 8000
```

Has the application crashed? What is the cause, and which two pieces of this
output point to it?

<details>
<summary>Answer</summary>

The application is fine: the `Up` status says its main process is running, and
the log shows it started and is listening on port 8000. The problem is in the
`PORTS` column, where Docker forwards host port 8080 to container port 8001.
Requests reach the container faithfully, but on a port where nothing listens.
Comparing the target side of the mapping with the port in the log is what
separates this from a stopped application, and recreating the container with
`127.0.0.1:8080:8000` fixes it. See
[A controlled mistake](05-running-but-unreachable.md#a-controlled-mistake).

</details>

## 3. A different message for the lab

You want the page to say `Lab open until 18:00` instead of your current
message. Which of these needs to change: the Python installation, the image or
the launch command? And why did we stop and remove the old container instead of
leaving it running while we changed the setting?

<details>
<summary>Answer</summary>

Only the launch command changes, through `-e MESSAGE="Lab open until 18:00"`.
The application reads that environment variable when it starts, so the image
can stay exactly as it is. The environment belongs to the
container from the moment Docker creates it, which means the existing
`ark-message` would keep its original message. Creating a replacement with the
new setting is how the new text reaches the application. See
[Change the message](04-make-it-yours.md#change-the-message).

</details>

## 4. Room for a second copy

A classmate wants their own copy of the service on your machine, with their own
message, while yours keeps running on port 8080. Which launch options must
differ for the second container, and which can stay the same? Try to justify
each choice before checking.

<details>
<summary>Answer</summary>

The container name must differ, because Docker identifies containers by a
unique name, and the host port must differ, because only one service can
publish `127.0.0.1:8080`. The `MESSAGE` value can differ simply because your
classmate wants their own text. The image and the container port 8000 can
both stay the same: each container has its own network
view, so both applications can listen on 8000 without colliding. `docker logs`
with each name then shows which instance handled which request. See
[A second copy for your colleague](05-running-but-unreachable.md#a-second-copy-for-your-colleague).

</details>

## 5. What goes in the handover

You send a colleague the `docker run` command you used for your message, and
nothing else. Their laptop has Docker Desktop but no Python, and they haven't
downloaded the course files. Will the service start for them? What does their
machine still need, and which parts of the result come from your command rather
than from the image?

<details>
<summary>Answer</summary>

It should start. The image `ghcr.io/pethron/ark-message:1` carries Python, the
application and the command that starts it, so the only requirements are a
working Docker that runs Linux containers, access to GitHub's container
registry for the first download and a free host port. What the image can't
carry is your choices for this particular run: the message and the host port
travel in the command, through `-e MESSAGE=...` and `-p`, which is why sending
the full command matters more than sending the image name alone. See
[Read the launch command](04-make-it-yours.md#read-the-launch-command).

</details>

## 6. Whose kernel is it?

On a Windows laptop with Docker Desktop, the installation check printed `linux`,
and the message service runs fine. When the Python process inside the container
needs the operating system to open a file or accept a connection, which kernel
handles that request?

<details>
<summary>Answer</summary>

The kernel of the Linux environment that Docker Desktop runs through
virtualization. A container is a process on its host's kernel and never brings
a kernel of its own, so a Linux container needs a Linux kernel underneath it.
Docker Desktop supplies one inside a small virtual machine, and all your Linux
containers share it. That's also why `docker info` reports `linux` on a Windows
or macOS laptop. See
[Where does the kernel live?](08-virtual-machines-vs-containers.md#where-does-the-kernel-live)

</details>

## 7. Running other people's code

Your department wants a service that compiles and runs programs submitted by
students, and anyone with a university account can submit. A colleague proposes
running each submission in an ordinary container on a shared Linux server,
"because it's lighter than a VM". Would you accept that design as it is? Which
risk shapes your decision?

<details>
<summary>Answer</summary>

I would start from VMs here, possibly with containers inside them, because the
submissions are arbitrary code from people you can't fully trust. Every ordinary
container on that server talks to the same host kernel, so a vulnerability in
reachable kernel code could let one submission cross the boundary and affect
the others or the host. A VM puts a guest kernel and the virtualization
boundary in the way, which is a stronger starting separation for this threat
model. Other answers can be defensible if they name the shared kernel and
explain what reduces that risk; "it's lighter" alone doesn't. See
[If something breaks inside](08-virtual-machines-vs-containers.md#if-something-breaks-inside).

</details>

When these feel comfortable, the [handover kata](katas/README.md) asks you to
build the same service for a colleague with much less guidance.
