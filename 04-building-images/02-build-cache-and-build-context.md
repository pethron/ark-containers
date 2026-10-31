---
title: "Build context and build cache"
track: architecture
---

# Build context and build cache

Suppose you edit `app.py` after building the message service's image. Would
a new container see the change? Before trying it, recall where Python finds
the file: the supplied `Dockerfile` copies `app.py` into the image at
`/app/app.py`, and the container receives it from there. Your editor changes
a different copy, on your computer, so we need another build to deliver the edit.

Let's follow that change through a build and see which work Docker repeats.

## Follow one changed file

Check that the default message is still `Hello from ARK`, then build a
reference image before editing. `--progress=plain` keeps the individual
build steps in your terminal so you can compare them:

```text
docker build --progress=plain -t ark-message:context-before .
docker build --progress=plain -t ark-message:context-before .
```

In the second build, look for `CACHED` beside the user creation, working
directory and copy steps. Docker has a stored result for those operations
and their inputs, so it can reuse them. Resolving the base image and exporting
the result still takes work; a cached build can take time without rerunning
your application steps.

Open `app.py` and change only the default message, `Hello from ARK`, to
`Built for the library`. Leave the `MESSAGE` environment setting and the
HTTP handler alone. Then build with another tag:

```text
docker build --progress=plain -t ark-message:context-after .
```

The `COPY` step should run again because one of its inputs changed, while
`RUN adduser -D ark` can still be cached. Start both versions, using the
already familiar loopback publishing and no `MESSAGE` override. Check first
that these names and ports are free:

```text
docker run -d --name ark-context-before -p 127.0.0.1:8080:8000 ark-message:context-before
docker run -d --name ark-context-after -p 127.0.0.1:8081:8000 ark-message:context-after
```

Open `http://127.0.0.1:8080/` and `http://127.0.0.1:8081/`. The first should
still say `Hello from ARK`; the second should say `Built for the library`.
If startup is still in progress, retry, then use `docker ps -a` and the
container's logs if the request keeps failing.

Both containers received their own starting files from an image. Rebuilding
assigned `context-after` to new content, while the first container kept using
the content selected when it was created. Even moving its tag later would
leave that container unchanged, because a container records the image ID it
was created from:

```text
docker inspect --format '{{.Image}}' ark-context-before ark-context-after
```

The two IDs should differ. To deploy an edit, build an image and create a
replacement container from it; restarting an existing container keeps its
original image and writable filesystem.

## Which directory can COPY see?

The final argument to `docker build` selects the **build context**. With `.`,
we give the builder this directory as its source of local files, subject to
the exclusions in `.dockerignore`. `COPY app.py /app/app.py` finds its source
relative to that context and writes its destination into the image filesystem.
The host directory and the image directory belong to different filesystems,
even when both happen to contain a folder called `app`.

The recipe itself is another input. By default Docker reads `Dockerfile` from
the context root, and `-f` can select a different recipe. Selecting another
Dockerfile leaves the meaning of the final context argument unchanged:

```text
docker build -f Dockerfile --progress=plain -t ark-message:context-after .
```

This becomes important when a recipe lives in a subdirectory. Its local
`COPY` sources still start at the context root, rather than beside the recipe.
They cannot reach arbitrary files above that root. If a necessary file is
outside the context, choose a suitable context deliberately and review what
it makes available, instead of trying to escape with `../`.

Our directory also contains examples for later chapters.
They are available to this context, but the explicit `COPY app.py` selects
only the application file. Making a file available to the builder and adding
it to the final image are two separate decisions.

## Why one edit repeats some work

Think of a build step as an operation with inputs: its instruction, the state
it starts from, and any source files it uses. Docker can reuse a previous
result while those inputs match. Once a step produces a changed result,
later steps that depend on it must be considered with that new input.

For `COPY`, file contents and relevant metadata contribute to the cache check;
the modification time alone does not. Merely touching a file is therefore
a poor cache experiment. A real content edit, like our changed message,
gives us something observable in both the build log and the service.

An ordinary `RUN` also depends on its preceding state, but Docker doesn't
check an internet package repository just to decide whether to reuse that
step. If `RUN pip install ...` was cached yesterday, the same step can be
reused today even if the repository has changed. The optional
[reproducible build inputs](../advanced/image-builds/reproducible-build-inputs.md)
chapter follows that difference further.

Filesystem-changing operations contribute layers to the image we hand over.
Configuration instructions such as `USER` and `CMD` record defaults without
adding application files. The cache tracks build operations more broadly,
so counting Dockerfile lines won't tell you either the number of filesystem
layers or how much work a rebuild will repeat.

## Make a prediction for the next recipe

Suppose a build copies the entire project, installs its dependencies, then
starts the service. What would changing a README do to the dependency step?
What if the recipe copied only a dependency list, installed that list, and
copied the application afterward? Keep your explanation: we'll measure that
difference when the service gains a dependency.

Restore the default message in `app.py` to `Hello from ARK` with your editor,
preserving any unrelated edits. Stop and remove only this chapter's resources:

```text
docker stop ark-context-before ark-context-after
docker rm ark-context-before ark-context-after
docker image rm ark-message:context-before ark-message:context-after
```

Use this model to [write a recipe of your own](03-write-the-services-dockerfile.md).
The official [cache invalidation guide](https://docs.docker.com/build/cache/invalidation/)
describes the input checks in more detail.
