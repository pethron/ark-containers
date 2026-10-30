---
title: "Package the service in an image"
track: runbook
---

# Package the service in an image

Our message service has always started from two inputs: the
`python:3.12-alpine` image, which supplies Python, and an `app.py` on your
computer, brought into the container through a mount. That's why the archive
handover at the end of module 03 still asked your colleague to keep `app.py`
beside the launch command. In this chapter we'll put the code inside the
image, so the receiving machine needs only the image and a few launch settings.

We'll start from a supplied recipe for that image, called a **Dockerfile**,
build it and run the service without a mount. The recipe also makes one change
you haven't seen yet: the application stops running as root. Once the service
answers, we'll check which user runs it and what that user can do with its
own code. Writing a Dockerfile of your own comes later in this module, after
we've looked at how the build uses these instructions.

## Read the recipe first

You need Docker running Linux containers, as set up in module 01, and
a network connection, because the build looks up the Python image on Docker
Hub. On Linux Engine, prefix Docker commands with `sudo` if your setup requires
it. From the root of your course checkout, move into the supplied example:

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\message-service
    ```

Run the commands in this chapter from that directory. Besides a short README,
it contains `app.py`, an identical copy of the message service from module 01,
and the `Dockerfile`. Keeping the copy here lets this module change its files
without touching any other module. The chapter uses the container names
`ark-built` and `ark-restored`, local port 8080 (one at a time), and a new
`ark-message-handover` directory beside `message-service`; check with
`docker ps -a` that the names and ports are free.

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
produce a new image. You can already read most of this recipe by comparing
it with the command that has started the service since module 01, run from
the directory containing `app.py`:

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

There's no need to run it now. The `--mount` makes your `app.py` appear at
`/app/app.py` inside the container, and the words after the image name tell
Python to run that file.

`FROM python:3.12-alpine` picks the starting point, the same image that has
supplied Python for every launch so far. Everything below it adds to that
image, so ours will contain Python and its supporting files as before.
`WORKDIR /app` creates the `/app` directory and makes it the working directory
for the instructions that follow and for the service. `COPY` then takes `app.py`
from this directory on your computer and places it at `/app/app.py` inside the
image, the path where the mount used to make it appear.

The last line records a default command. An image carries defaults such as
a command or a user, as we saw in module 03, and the words after the image
name in `docker run` override the default command. Until now we've
written `python /app/app.py` there ourselves; `CMD` stores the same command in
the image, so a container started without one runs our service.

That leaves `RUN adduser -D ark`, `USER ark` and the `--chmod=644` on the copy.
Together they decide who runs the service and what it can do with its code.
We'll unpack them once the service is running and we can check the result.
Before building, take a moment to predict: which parts of the launch command
above should we no longer need?

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

## Run it without the source file

Check `docker ps -a` before launching: the name `ark-built` and local port 8080
must be free. Then start a container from the new image:

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

Compare it with your answer to the prediction. The `--mount` option has gone,
and nothing follows the image name, so Docker uses the image's `CMD`.
The message and the port are still in the command because they describe
this particular instance: you could start a second container from the same
image with another message on another port. The command no longer refers to
any file on your computer, so it would work from any directory.

Open `http://127.0.0.1:8080/`. You should see the message
`Packaged with its code`, and `/health` should return `{"status": "ok"}`.
If the page fails right after the launch, give the service a moment and retry;
if it keeps failing, `docker ps -a` shows whether the container is still
running and `docker logs ark-built` shows what the service printed.

Let's also confirm where the code came from. Ask Docker which mounts this
container has:

```text
docker inspect --format '{{json .Mounts}}' ark-built
```

The answer is an empty list, `[]`. Python found `/app/app.py` in the files the
container received from our image, which is what we wanted: anyone with this
image can run the service without a copy of the source.

## Who runs the service now?

Since module 01, the service has run as **root**, the administrator account
on Linux systems and the default user of the Python image. Root can read,
change or delete any file in the container, and Linux lets it perform
privileged operations that ordinary accounts can't. Our service needs very
little of that: it reads one file, listens on port 8000 and writes nothing.
If a bug or an attacker ever took control of the process, it would be better
for them to inherit an account with exactly those limited rights. Containers
add their own boundaries around root, and module 08 looks at how those
protections combine; giving the service its own account is the first step.

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
for PID 1, `python /app/app.py`. With the plain Python image, the same column
showed `root` for the server; this time the account comes from our image.

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

## What changed in the handover

Here's how the packaged service compares with the launch from module 01:

| | Module 01 launch | Packaged image |
|---|---|---|
| Python and its supporting files | From `python:3.12-alpine` | From our image, built on `python:3.12-alpine` |
| `app.py` | Mounted from your computer, read-only | Copied into the image, readable by `ark` |
| Command | Typed after the image name | Recorded with `CMD` |
| User | The image default, root | `ark`, recorded with `USER` |
| Message and port | Launch settings | Launch settings |

Your colleague now needs the image and the launch settings, and no source
file. That's the claim to test next.

## Try the handover yourself

Let's prove that claim the way your colleague would receive the service:
as an archive file. `docker image save` writes an image's layers,
configuration and tag into a single `.tar` file, and `docker image load`
reads that file back into an engine. We'll do both on your computer,
remove the tag in between, and start the restored image from a directory
that contains no `app.py`.

There's one detail to plan for. `ark-message:first-build` is the only name
our new image has, and Docker refuses to remove that name while a container
still uses the image. Stop and remove `ark-built` first:

```text
docker stop ark-built
docker rm ark-built
```

Next, create an empty handover directory beside `message-service` and move
into it. If `ark-message-handover` already exists, stop and inspect its
contents before continuing, so you don't overwrite an earlier archive:

=== "Linux (Bash)"

    ```bash
    mkdir ../ark-message-handover
    cd ../ark-message-handover
    ```

=== "Windows (PowerShell)"

    ```powershell
    New-Item -ItemType Directory -Path ..\ark-message-handover
    Set-Location ..\ark-message-handover
    ```

To check the restoration later, we need something to compare with. Record
the image's full ID, then save the image into `message.tar`:

```text
docker image inspect --format '{{.Id}}' ark-message:first-build
docker image save --output message.tar ark-message:first-build
```

Mind that Docker also has a `docker export` command, which writes a container's
filesystem. Use `image save` here, because loading needs the image metadata,
including its `USER` and `CMD`, along with its layers.

Before removing the tag, check that the archive exists, because it will be
the only copy of the image until you load it again:

=== "Linux (Bash)"

    ```bash
    ls -l message.tar
    ```

=== "Windows (PowerShell)"

    ```powershell
    Get-Item .\message.tar
    ```

Now remove the tag and check that no `ark-message:first-build` row remains.
Since no other name points to the image, Docker also deletes the layers our
recipe added, while the Python base image stays available:

```text
docker image rm ark-message:first-build
docker image ls ark-message
```

Load the archive and repeat the inspection. The ID should match the one you
recorded, which tells us the archive restored the same image and its tag:

```text
docker image load --input message.tar
docker image inspect --format '{{.Id}}' ark-message:first-build
```

Start the restored image from this directory, with a message of your choice.
`--pull never` makes Docker fail rather than download anything, so the
container must use the image we just loaded:

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-restored --pull never \
      -e MESSAGE="Restored from the archive" \
      -p 127.0.0.1:8080:8000 \
      ark-message:first-build
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-restored --pull never `
      -e MESSAGE="Restored from the archive" `
      -p 127.0.0.1:8080:8000 `
      ark-message:first-build
    ```

Your check passes when:

- `http://127.0.0.1:8080/` returns your message and `/health` returns
  `{"status": "ok"}`, retrying briefly if the service is still starting.
- `docker inspect --format '{{json .Mounts}}' ark-restored` prints `[]`.
- `docker exec ark-restored ps` shows `ark` in the `USER` column for
  `python /app/app.py`.

The handover directory holds only `message.tar`, yet the service answers,
because everything it needs travelled inside the image. Beware, though: this
test ran on the same engine that built the image, where Docker kept the Python
base layers, so trying the archive on another computer remains a separate check.

When you've finished, stop and remove the restored container, go back to
`message-service`, and delete only the archive and its directory:

```text
docker stop ark-restored
docker rm ark-restored
```

=== "Linux (Bash)"

    ```bash
    cd ../message-service
    rm ../ark-message-handover/message.tar
    rmdir ../ark-message-handover
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location ..\message-service
    Remove-Item ..\ark-message-handover\message.tar
    Remove-Item ..\ark-message-handover
    ```

## Before the next build

Here's a question to keep for the next chapter. Suppose you edit the default
message in `message-service/app.py` now and start a new container from
`ark-message:first-build` without setting `MESSAGE`. Would it show your edit?
Write down your prediction and what you think you would need to do; we'll
test it as we look at how Docker uses the build context and reuses earlier work.

The next chapter builds the images it needs, so you can clean up now. If you
skipped the handover, stop and remove `ark-built` with the two commands at
the start of the previous section. Then remove the image:

```text
docker image rm ark-message:first-build
```

That removes our tag and the layers no other image uses, while the Python
base image stays available for the next builds.
