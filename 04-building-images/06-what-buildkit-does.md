---
title: "What BuildKit does with a recipe"
track: architecture
pagination_next: 04-building-images/katas/README
---

# What BuildKit does with a recipe

The dependency build reused its installation step after you edited application
code. That saved work because the builder knew which inputs the step depended
on. What happens when a build needs tools that the running service doesn't
need? Let's follow a recipe with two stages and see which result reaches the
service.

## Follow the stages

The previous chapter left your terminal in `message-service`. Move back to
the supplied `template-service`:

=== "Linux (Bash)"

    ```bash
    cd ../template-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location ..\template-service
    ```

Open `Dockerfile.multistage`. The first `FROM` names a stage `build`; it
installs a compiler and prepares Python packages under `/install`. The second
`FROM` begins a fresh `runtime` stage, and `COPY --from=build /install
/usr/local` takes the prepared packages from the first stage. It doesn't copy
the compiler itself.

Ask BuildKit which targets that recipe exposes:

```text
docker buildx build --call=targets -f Dockerfile.multistage .
```

You should see `build` and `runtime`, with `runtime` as the default. If your
Buildx version doesn't support `--call=targets`, read the two named `FROM`
lines in the file instead; the builds below still let you inspect the result.
Check `docker image ls ark-template` before using the tags below. If they
belong to another task, choose unused tags and use those consistently.

Build just the first target. This needs network access to install the compiler
and packages inside the build environment; it doesn't install them on your
computer:

```text
docker build --progress=plain --target build -f Dockerfile.multistage -t ark-template:build-stage .
docker run --rm ark-template:build-stage ls /install/lib/python3.12/site-packages
```

The listing contains the prepared packages, including Jinja2 and MarkupSafe.
Now build the default target:

```text
docker build --progress=plain -f Dockerfile.multistage -t ark-template:multistage .
```

Look for reused build-stage steps in the output. BuildKit represents operations
and their dependencies as a graph: the `runtime` stage needs the result of
`build` at `COPY --from=build`, but a stage with no path to the selected target
doesn't need to run. The graph also lets the builder reuse matching results;
it doesn't make a changed input disappear.

## Test what reached the service

Check that `ark-stage` and loopback port 8080 are free, then start the result:

```text
docker run -d --name ark-stage -e AUDIENCE="the release team" -p 127.0.0.1:8080:8000 ark-template:multistage
docker exec ark-stage python -c "import jinja2, markupsafe._speedups; print(jinja2.__version__)"
docker exec ark-stage sh -c 'if command -v gcc; then echo compiler-found; else echo no-compiler; fi'
```

Open `http://127.0.0.1:8080/` and `/health`. The service should return
`Hello the release team` and a successful health response. The import checks
the installed dependency, while `no-compiler` shows that this runtime image
didn't carry the compiler from the build stage. If startup fails, inspect
`docker logs ark-stage` before removing it.

## A cache for work that runs again

Open the supplied `Dockerfile.cache-mount` and find this build-stage line:

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip wheel --no-binary=MarkupSafe --wheel-dir=/wheels -r requirements.txt
```

The mount gives pip a reusable cache directory for this operation. If the
operation's inputs change, BuildKit may need to run it again, but pip can
reuse downloaded or built packages from that cache. The cache mount is
separate from the operation's output and doesn't ship as part of the final
image. It can also be empty or reclaimed, so a correct build must still work
without a warm cache.

That's a different kind of reuse from the `CACHED` dependency step you saw
earlier: the step cache skips an unchanged operation, while the cache mount
can help when the operation runs. The optional
[cache-mount experiment](../advanced/image-builds/buildkit-stages-and-cache-mounts.md#give-pip-a-cache-that-outlives-the-step)
compares repeated builds in more detail.

## One recipe, two platforms

The course image you inspected in module 03 has `linux/amd64` and
`linux/arm64` manifests. The course's `.github/workflows/image.yml` uses the
message-service directory as its build context and requests both platforms
from Buildx before publishing the resulting reference. Each platform still
needs a suitable base image and a builder able to execute or build for that
target; emulation is one possible approach. A multi-platform index makes the
variants discoverable, not interchangeable.

Which result would you give a colleague: the compiler-bearing `build` stage
or the tested `runtime` image? Explain your choice using both the service's
HTTP result and the files each stage needs.

Remove the resources from this chapter, leaving shared bases and build cache:

```text
docker stop ark-stage
docker rm ark-stage
docker image rm ark-template:build-stage ark-template:multistage
```

The [packaging kata](katas/README.md) asks you to make and verify a build
decision for a receiver of your own.
