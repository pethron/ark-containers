# Template message service

This example adds a small, supplied launcher to the
[original message service](../message-service/README.md). Jinja2 renders
`Hello {{ audience }}` using the `AUDIENCE` environment setting, then the
launcher starts the unchanged application. `MESSAGE` takes precedence when
you provide it, and the service still returns JSON on `/` and `/health`.

Use the [dependency chapter](../05-dependencies-and-build-cache.md)
for the measured walkthrough. For a standalone run, work from this directory
in Linux Bash or PowerShell 7 with Docker running Linux containers and internet
access. Linux Engine may require `sudo` for Docker commands.

## Build and run

The default recipe installs Jinja2 before copying the application, so a source
edit can reuse the dependency step. pip uses prebuilt wheels; the recipe needs
no compiler. It records `ark` as the application user and keeps code root-owned
and readable, as in the
[permission explanation](../01-package-the-service-in-an-image.md#what-ark-can-do-with-its-code).
Build it with:

```text
docker build -t ark-template:cached .
```

Check that `ark-template` and port 8080 are free, then launch:

```text
docker run -d --name ark-template -e AUDIENCE="the release team" -p 127.0.0.1:8080:8000 ark-template:cached
```

Check the response after startup:

=== "Linux (Bash)"

    ```bash
    curl http://127.0.0.1:8080/
    curl http://127.0.0.1:8080/health
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe http://127.0.0.1:8080/
    curl.exe http://127.0.0.1:8080/health
    ```

Expect a JSON message `Hello the release team` and `{"status": "ok"}`.
Retry if startup hasn't finished; use `docker ps -a` and
`docker logs ark-template` if failure persists. The launcher doesn't add
signal handling, so stopping this original server can still take Docker's
default grace period before forced termination.

## Files and comparison recipe

- [app.py](app.py) is a byte-identical copy of the original application.
- [serve.py](serve.py) prepares its default message without changing its handler.
- [requirements.txt](requirements.txt) pins the direct Jinja2 dependency.
- [Dockerfile](Dockerfile) installs dependencies before copying the application.
- [Dockerfile.baseline](Dockerfile.baseline) copies the application before
  installing dependencies, so a source edit reruns pip.
- [Dockerfile.oversized](Dockerfile.oversized),
  [Dockerfile.multistage](Dockerfile.multistage),
  [Dockerfile.cache-mount](Dockerfile.cache-mount) and
  [requirements-compiled.txt](requirements-compiled.txt) support the optional
  [multi-stage and BuildKit deep dive](../../advanced/image-builds/README.md).

The `.dockerignore` uses an allowlist: only the recipes, requirements and two
source files are ordinary context inputs. Clone the complete directory so
that this hidden file is present too.

To build the baseline, select that recipe explicitly:

```text
docker build -f Dockerfile.baseline -t ark-template:baseline .
```

It should serve the same requests. Its earlier source copy is the starting
point for the
[cache kata](../katas/README.md#improve-the-supplied-build). The compiler-bearing
comparison belongs to the optional advanced chapter.
The image has no authentication, TLS or durable data, and its base image tag
can move between builds.

## Cleanup

Stop and remove the named container before deleting an image it uses:

```text
docker stop ark-template
docker rm ark-template
docker image rm ark-template:cached
```

If you built the comparison image, also remove `ark-template:baseline` with
`docker image rm ark-template:baseline`. Keep shared bases and builder
caches; no global prune is needed.
