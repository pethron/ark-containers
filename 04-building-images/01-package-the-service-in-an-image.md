---
title: "Building and running your first image"
track: runbook
---

# Building and running your first image

Since module 01, the message service has started from one image,
`ghcr.io/pethron/ark-message:1`, and you've seen that it carries everything the
service needs: Python, `app.py`, the command that starts it and an ordinary
user to run it. Somebody had to put those pieces together. In this chapter
you'll do it yourself, from the same recipe the course uses to publish that
image, and check that your build gives you a service that behaves the same.

That recipe is called a **Dockerfile**. We'll read it, build it and run the
result, then look at the lines that decide which user runs the service and what
that user can do with its own code. Writing a Dockerfile of your own comes
later in this module, after we've looked at how the build uses these
instructions.

## Read the recipe first

You need Docker running Linux containers, as set up in
[Before you start](../before-you-start.md), the course files and a network
connection, because the build looks up the Python image on Docker Hub. On
Linux Engine, prefix Docker commands with `sudo` if your setup requires it.
From the [root of your course checkout](../before-you-start.md#get-the-course-files), move into the supplied example:

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\message-service
    ```

Run the commands in this chapter from that directory. Besides a short README,
it contains `app.py`, the message service's code, and the `Dockerfile`; a few
other files belong to later chapters. The chapter uses the container name
`ark-built` and local port 8080. Check `docker ps -a` for a container already
using that name. If port 8080 is unavailable, Docker reports a bind error when
you start the service; change the host-side `-p` value to a free loopback port
and update the URL.

Open `Dockerfile` in your editor. It's short enough to read in full:

```dockerfile
FROM python:3.12-alpine

RUN adduser -D ark

WORKDIR /app
COPY --chmod=644 app.py /app/app.py

USER ark

CMD ["python", "/app/app.py"]
```

Each line starts with an instruction, and Docker follows them in order to
produce a new image. If you've looked at `docker image history` for the course
image, these lines will feel familiar: each instruction left one of the entries
at the top of that list.

`FROM python:3.12-alpine` picks the starting point, the official Python image
on Docker Hub. Everything below it adds to that image, so ours will contain
Python and its supporting files. `WORKDIR /app` creates the `/app` directory
and makes it the working directory for the instructions that follow and for
the service. `COPY` then takes `app.py` from this directory on your computer
and places it at `/app/app.py` inside the image.

The last line records a default command. An image carries defaults such as
a command or a user, and the words after the image name in `docker run`
override the default command. `CMD` stores `python /app/app.py` in the image,
which is why a container started with nothing after the image name runs our
service.

That leaves `RUN adduser -D ark`, `USER ark` and the `--chmod=644` on the copy.
Together they decide who runs the service and what it can do with its code.
We'll unpack them once the service is running and we can check the result.
Before building, take a moment to predict: will your image have the same ID as
the one you downloaded from the course registry?

## Build the image

Ask Docker to follow the recipe and name the result:

```text
docker build -t ark-message:first-build .
```

`-t` gives the new image a repository name and tag, the reference we'll use
to start containers from it. The final `.` tells Docker to use the
current directory as the **build context**, the set of files the build can
copy from; that's where `COPY` finds `app.py`. We'll look at what Docker does
with that directory in the next chapter.

The output lists numbered steps such as `[1/4] FROM`, `[2/4] RUN adduser -D ark`,
`[3/4] WORKDIR /app` and `[4/4] COPY`, and ends by naming the image
`ark-message:first-build`. `USER` and `CMD` have no step of their own because
they only record settings in the image's configuration, with no files to
produce. You'll also notice Docker loading metadata for `python:3.12-alpine`:
the build checks the registry for that tag, so if its publisher has moved it
since you last pulled it, your image will start from the newer Python build. We'll come
back to that when we talk about how repeatable a build is.

Check that the image is now available locally:

```text
docker image ls ark-message
```

You should find a row for `ark-message:first-build`, with an ID of its own.
Our recipe added a user, a directory and a file to the Python image, so the
result is new content with a new identity. Giving the Python image an extra
name with `docker tag` would keep its ID; building changes what the image
contains.

<details>
<summary>The build stops before the first step</summary>

If Docker reports that it can't find a `Dockerfile`, check that your terminal
is in `04-building-images/message-service`, where both the recipe and `app.py`
live. An error saying that `--chmod` requires BuildKit means your Docker
installation is using the older builder; on Linux Engine, install the Buildx
plugin following the
[official Docker Engine guide](https://docs.docker.com/engine/install/), then
build again. If the base image can't be resolved, check your network
connection and read the first error line, which names the reference Docker
was looking for.

</details>

## Run your build

Check `docker ps -a` for a container already named `ark-built`, then start a
container from the new image:

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-built \
      -e MESSAGE="Packaged with its code" \
      -p 127.0.0.1:8080:8000 \
      ark-message:first-build
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-built `
      -e MESSAGE="Packaged with its code" `
      -p 127.0.0.1:8080:8000 `
      ark-message:first-build
    ```

The command has the same shape as the one you've used since module 01, with
our local name in place of the course image. Nothing follows the image name,
so Docker uses the image's `CMD`. The message and the port are still in the
command because they describe this particular instance: you could start a
second container from the same image with another message on another port.

Open `http://127.0.0.1:8080/`. You should see the message
`Packaged with its code`, and `/health` should return `{"status": "ok"}`.
If the page fails right after the launch, give the service a moment and retry;
if it keeps failing, `docker ps -a` shows whether the container is still
running and `docker logs ark-built` shows what the service printed.

## Who runs the service?

When you looked inside the running service in module 02, `ps` showed it
running as `ark`. Without the recipe's help, it would run as **root**, the
administrator account on Linux systems and the default user of the Python
image. Root can read,
change or delete any file in the container, and Linux lets it perform
privileged operations that ordinary accounts can't. Our service needs very
little of that: it reads one file, listens on port 8000 and writes nothing.
If a bug or an attacker ever took control of the process, it would be better
for them to inherit an account with exactly those limited rights. The
container still shares its host's Linux kernel, and `root` has broad
privileges inside the container. Running the service as a dedicated account
reduces those privileges.

That's the job of two lines in our recipe. `RUN adduser -D ark` runs a command
during the build, inside the image being created: Alpine's `adduser` adds an
account named `ark` to the image's list of users, and `-D` skips setting a
password because nobody will log in as `ark`. Your computer's accounts don't
change. `USER ark` then makes `ark` the default user for the remaining
instructions and for every container started from the image. Docker records
both defaults in the image configuration, where you can read them:

```text
docker image inspect --format '{{.Config.User}} {{.Config.Cmd}}' ark-message:first-build
```

You should see `ark [python /app/app.py]`. To check what the running process
actually uses, open an interactive shell inside the running container; `-it`
connects your terminal to it:

```text
docker exec -it ark-built sh
```

The following commands run inside the Linux container:

```sh
whoami
ps
```

`whoami` prints `ark`, because the shell started by `docker exec` also uses
the image's default user. In the `ps` listing, the `USER` column shows `ark`
for PID 1, `python /app/app.py`. Without `USER ark`, the same column would
show `root`, the Python image's default.

## What ark can do with its code

Stay in the shell and look at the application directory and file. The `-l`
option asks for the long listing with owners and permissions, and `-d` shows
the `/app` entry itself instead of its contents:

```sh
ls -ld /app /app/app.py
```

The output should resemble these lines, apart from dates and sizes:

```text
drwxr-xr-x    1 root     root          4096 Oct 30 09:48 /app
-rw-r--r--    1 root     root          1124 Oct 29 09:45 /app/app.py
```

The two `root` columns show the owner and the group: `COPY` gives copied
files to root unless the recipe asks for another owner, and `WORKDIR` creates
the directory the same way. The first column describes the permissions.
Its first character marks a directory (`d`) or a regular file (`-`), and the
next nine characters form three groups of three: what the owner may do, what
members of the group may do, and what everyone else may do. `r` allows reading,
`w` allows writing, and `x` allows running a file as a program or, on a
directory, entering it to reach the files inside.

Our `ark` account falls into "everyone else". It may enter `/app` and read
`app.py`, which is all Python needs to start the service, but it can't change
either of them. The `644` in `--chmod=644` is a compact way of writing the
file's permissions: `6` grants read and write to the owner, and each `4`
grants read only, to the group and to everyone else. Try changing the code
from the running container:

```sh
echo "# changed" >> /app/app.py
```

The shell answers `sh: can't create /app/app.py: Permission denied`. The process
running the service can't rewrite the code it runs, which is a useful default
for any application that doesn't need to modify itself. It can still write
where Linux allows every user, such as `/tmp`, so a temporary note would
still work there. Leave the shell when you're done:

```sh
exit
```

Why state `644` in the recipe at all? Without `--chmod`, `COPY` keeps the
permissions the file had in the build context, and those depend on the
computer and filesystem where you run the build. Writing them into the recipe
gives the image the same result wherever it's built.

<details>
<summary>The container exits with "Permission denied"</summary>

If `docker ps -a` shows `ark-built` as exited and `docker logs ark-built`
reports `python: can't open file '/app/app.py': [Errno 13] Permission denied`,
`ark` can't reach or read the file. Compare your `Dockerfile` with the supplied
one: the `WORKDIR` line must come before `COPY`, and the `--chmod` value must
let everyone read the file. After correcting the recipe, build again, then
remove the exited container before starting its replacement.

</details>

## Your build and the course image

Time to check your prediction from the start of the chapter, by comparing
your image with the one you've been downloading. If the course image isn't on this engine yet, `docker pull
ghcr.io/pethron/ark-message:1` fetches it. Then list the two images' IDs and
the steps that produced them:

```text
docker image ls ark-message
docker image ls ghcr.io/pethron/ark-message
docker image history ark-message:first-build
docker image history ghcr.io/pethron/ark-message:1
```

The two histories list the same instructions in the same order, from `RUN
adduser -D ark` up to the `CMD`, on top of the Python layers. The IDs, though,
are different. An image's ID is calculated from its content and configuration,
and the configuration records details such as when each step ran, so two
builds of the same recipe on different machines and days end up with
different IDs. Your build may also have started from a newer
`python:3.12-alpine` than the one the course image used, if its publisher has
moved the tag in the meantime.

So which one should you give a colleague? Give them the image you've tested,
identified by its ID. If they rebuilt it from the recipe, they'd get yet
another ID and possibly a newer Python underneath, which is exactly the drift
a handover is meant to avoid. The recipe stays useful to whoever makes the next
version, and the published image saves everyone else from building it at all.

When you've finished comparing, stop and remove the container:

```text
docker stop ark-built
docker rm ark-built
```

## Before the next build

Here's a question to keep for the next chapter. Suppose you edit the default
message in `message-service/app.py` now and start a new container from
`ark-message:first-build` without setting `MESSAGE`. Would it show your edit?
Write down your prediction and what you think you would need to do; we'll
test it as we look at how Docker uses the build context and reuses earlier work.

The next chapter builds the images it needs, so you can clean up now. If
`ark-built` is still there, stop and remove it with the two commands at the
end of the previous section. Then remove the image:

```text
docker image rm ark-message:first-build
```

That removes our tag and the layers no other image uses, while the Python
base image and the course image stay available.
