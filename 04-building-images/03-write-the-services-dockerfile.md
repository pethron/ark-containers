---
title: "Write the service's Dockerfile"
track: runbook
---

# Write the service's Dockerfile

You've seen a supplied recipe build the message service into an image.
Now prepare a build directory of your own. The goal is still the same HTTP
service, but you will decide which files the builder receives and record the
defaults that let someone else launch it.

## Set up a separate build directory

The previous chapter leaves the terminal in `message-service`. Create a
sibling directory for your own recipe, and inspect any existing attempt
before copying files so that you don't overwrite your work:

=== "Linux (Bash)"

    ```bash
    mkdir ../my-message-service
    cp app.py ../my-message-service/app.py
    cd ../my-message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    New-Item -ItemType Directory ..\my-message-service
    Copy-Item .\app.py ..\my-message-service\app.py
    Set-Location ..\my-message-service
    ```

No local Python installation is needed. The image supplies Python for both
the build environment and the eventual container.

## Choose the inputs and defaults

Before writing, answer four questions: which base supplies Python, where
will the code live, which user should read it, and which command starts the
service? Use your answers to create a file named `Dockerfile`, without a
`.txt` extension. This reference follows the supplied recipe in
`message-service`:

```dockerfile
FROM python:3.12-alpine
RUN adduser -D ark
WORKDIR /app
COPY --chmod=644 app.py /app/app.py
USER ark
EXPOSE 8000
CMD ["python", "/app/app.py"]
```

The addition is `EXPOSE 8000`. It documents the port the application listens
on inside the container; publishing it to your laptop still requires `-p`.
Someone inspecting the image can discover this intention, but the instruction
neither starts a listener nor makes it reachable from outside.

Keep the code owned by root and readable by `ark`. `COPY` gives the file to
root, and `--chmod=644` lets its owner read and write it while everyone else,
`ark` included, may only read it; the
[first chapter](01-package-the-service-in-an-image.md#what-ark-can-do-with-its-code)
checks those permissions in a running container. Giving `ark` ownership would
also let it rewrite the application, which this service has no reason to do.
`RUN adduser -D ark` creates the account inside the image during the build;
there is no laptop account to create.

## Keep the context deliberate

Alongside the recipe, create `.dockerignore` with these lines:

```text
*
!app.py
!Dockerfile
!.dockerignore
```

The first pattern excludes everything. A later pattern beginning with `!`
includes a matching file again, leaving a small allowlist for this particular
application. Docker processes this file before sending context files to the
builder, so it also reduces what a remote builder could receive.

This rule is deliberately narrow. When the application later needs another
file, add that file to the allowlist and decide explicitly how to copy it.
`.gitignore` controls Git tracking and has no such effect on a Docker build.
For a larger project, keeping `.env`, credentials, editor files and generated
output out of the context is part of defining the build's inputs.

Add a file named `.env` containing only `PUBLIC-LAB-MARKER` to this working
directory, using your editor. It is a harmless stand-in, not a credential.
Leave it excluded; we have no reason to send it to the builder.

Build your image:

```text
docker build --progress=plain -t ark-message:own .
```

Expect the application copy to succeed. If it says `app.py` cannot be found,
check both the final context directory and the allowlist before looking for
a Python problem: the build hasn't started the service yet.

## Test the handover contract again

Make sure `ark-own` and port 8080 are free. The exact command works in either
host shell:

```text
docker run -d --name ark-own -e MESSAGE="A recipe I can explain" -p 127.0.0.1:8080:8000 ark-message:own
```

Open `http://127.0.0.1:8080/` and `/health` on the same address. Expect your
message and `{"status": "ok"}`; retry after startup, then inspect state and
logs if needed. Confirm the settings separately:

```text
docker inspect --format '{{json .Mounts}}' ark-own
docker image inspect --format '{{.Config.User}} {{json .Config.ExposedPorts}}' ark-message:own
docker exec ark-own ls -l /app/app.py
```

Expect no mounts, the user `ark`, a declared `8000/tcp`, and root-owned code
readable by everyone but writable only by root. The successful HTTP request
also confirms that the image contains enough to run the application.
The dummy `.env` remains a host-side file outside these selected inputs.

## Diagnose a missing input

Predict the next result, then temporarily remove `!app.py` from your
`.dockerignore`. Try the same build command again. It should fail while
resolving the `COPY` source, even though your editor can still open the file.
Read the error as evidence about the context: exclusion makes the source
unavailable to that operation.

Restore `!app.py` and rebuild. Docker can recover the earlier cached result
once the required inputs are available again. Your already running `ark-own`
was unaffected by either attempt, because building and running are separate
operations.

Now adapt the recipe without the full reference: put the code under `/service`
instead of `/app`, and keep the same HTTP behavior and non-root permissions.
Decide which instructions must change before editing. Rebuild, replace the
container and check the response; a restart alone won't test the new image.
If Python reports a missing file, compare the copied destination with the
path in `CMD`.

Keep your recipe and ignore file if you'd like to use them in the
[module kata](katas/README.md). When stopping here:

```text
docker stop ark-own
docker rm ark-own
docker image rm ark-message:own
```

Delete only the dummy `.env` through your editor when you've finished using
it. Keep your source work. Next we'll investigate what the recorded start
command means for [arguments and stop signals](04-commands-and-signals.md).
For other ignore patterns, consult the official
[build context reference](https://docs.docker.com/build/concepts/context/#dockerignore-files).
