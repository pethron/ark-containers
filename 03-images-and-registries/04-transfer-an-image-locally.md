---
title: "Transfer an image locally"
track: runbook
---

# Transfer an image locally

We have a name for our handover and know which parts of the service the
image contains. Let's turn it into a file your colleague can receive:
Docker can save the image's layers, configuration and tag in an archive,
then load that archive back into an engine. We'll do both steps on your
computer so that we can check the procedure before asking someone else
to follow it.

Open a terminal in **`01-why-containers/first-app`**, where `app.py` lives,
and keep `ark-runtime:handover` from chapter 02 available. The archive will
take additional disk space alongside Docker's stored image, so make sure
you have room for both before starting.

## Save the named image

We'll keep the handover in its own directory so it's easy to find and
remove after the exercise. Create it with the command for your shell;
if the directory already exists, stop and inspect its contents before
continuing to avoid overwriting an earlier archive or someone else's files.

=== "Linux (Bash)"

    ```bash
    mkdir ark-image-handover
    ```

=== "Windows (PowerShell)"

    ```powershell
    New-Item -ItemType Directory -Path .\ark-image-handover
    ```

Once the directory is ready, ask Docker to save our tagged image into
`runtime.tar`:

```text
docker image save --output ark-image-handover/runtime.tar ark-runtime:handover
```

The resulting `runtime.tar` contains what Docker needs to restore this
image, including its configuration, layers and handover tag. From the
previous chapter, we can also predict what stays outside the archive:
`app.py` belongs to the host mount, the note belongs to a container's
writable filesystem, and running processes belong to that container's
execution.

Mind that Docker also has an `export` command for exporting a container's
filesystem. Use `image save` here, because our next step needs an image
archive with the metadata required by `image load`.

## Restore the name from the archive

To check the restoration, we need something to compare with the result.
Record the image's full ID and platform before removing its handover tag:

```text
docker image inspect --format '{{.Id}}' ark-runtime:handover
docker image inspect --format '{{.Os}}/{{.Architecture}}' ark-runtime:handover
```

We can now remove **only our extra tag**. Because
`python:3.12-alpine` still points to the same image, Docker keeps that
reference and its content available for the other exercises:

```text
docker image rm ark-runtime:handover
docker image ls ark-runtime
```

Check that the `handover` row has disappeared, then load the archive.
Repeating the inspection commands will let us see whether the restored
reference leads back to the image we saved:

```text
docker image load --input ark-image-handover/runtime.tar
docker image inspect --format '{{.Id}}' ark-runtime:handover
docker image inspect --format '{{.Os}}/{{.Architecture}}' ark-runtime:handover
```

Compare both values with your notes before continuing; the ID and platform
should match. That gives us evidence that our archive restores the reference
and image identity on this engine. When you write your handover, include
that test condition: Docker could reuse layers still in its cache, so
trying the archive on another computer remains a separate check. Leave
the cache in place, since clearing shared images would disrupt other work.

## Use the restored image for our service

Now let's use the restored reference to run the application again.
Check that `ark-image-service` and loopback port 8085 are free, then launch
it from the same `first-app` directory. We've kept `--pull never` in the
command so that the service must use the locally available image:

=== "Linux (Bash)"

    ```bash
    docker run -d --name ark-image-service --pull never \
      --mount "type=bind,source=$(pwd)/app.py,target=/app/app.py,readonly" \
      -e MESSAGE="Loaded from our archive" \
      -p 127.0.0.1:8085:8000 \
      ark-runtime:handover python /app/app.py
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker run -d --name ark-image-service --pull never `
      --mount "type=bind,source=$($PWD.Path)\app.py,target=/app/app.py,readonly" `
      -e MESSAGE="Loaded from our archive" `
      -p 127.0.0.1:8085:8000 `
      ark-runtime:handover python /app/app.py
    ```

Open `http://127.0.0.1:8085/` and `/health` on that address to check the
message and health response. You should see `Loaded from our archive` and
`{"status": "ok"}`; if the application needs a moment to start, retry,
then read `docker logs ark-image-service` if it keeps failing. Once it
responds, check which image Docker used for this container:

```text
docker inspect --format '{{.Image}}' ark-image-service
```

The returned ID should match the one in your notes, connecting the running
service to the image we saved and restored. Notice that the launch still
mounts `app.py`: the archive supplied Python and its supporting files,
while your source file and message setting completed the service at launch.
In module 04 we'll bring the source into an image of our own.

For now, keep the archive and tag while you finish the handover notes,
and stop and remove only this test service:

```text
docker stop ark-image-service
docker rm ark-image-service
```

With the local test complete, let's put together
[the information your colleague will need](05-choose-the-reference-to-hand-over.md)
to use the archive.
