---
title: "Multi-stage builds and cache mounts"
track: architecture
---

# Multi-stage builds and cache mounts

The core module installed a pure-Python dependency and kept its installation
cached after an application edit. Some dependencies need a compiler to build,
and those tools have no place in the running service. Let's use the supplied
template service to compare a compiler-bearing image with a multi-stage build,
then see how a package cache helps when an installation really has to run
again.

Use Linux Bash or PowerShell 7 with Linux containers and an internet
connection. Linux Engine may require `sudo` for Docker. From the course
checkout root:

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/template-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\template-service
    ```

## Let one stage build, another one run

The core `requirements.txt` pins Jinja2. The optional
`requirements-compiled.txt` also pins MarkupSafe and the recipes request its
source build, which needs Alpine's `build-base` compiler. `Dockerfile.oversized`
keeps that compiler in the final image. `Dockerfile.multistage` starts a fresh
runtime stage and copies only the installed packages across.

Build both recipes for comparison:

```text
docker build --progress=plain -f Dockerfile.oversized -t ark-template:oversized .
docker build --progress=plain -f Dockerfile.multistage -t ark-template:multistage .
docker image inspect --format '{{.RepoTags}} {{.Size}}' ark-template:oversized ark-template:multistage
```

`.Size` reports the local image's bytes. In one Docker Desktop Linux amd64
run, the compiler-bearing image measured 121,892,080 bytes and the
multi-stage image 18,484,677, about 85% less. Your base image and package
resolution may differ, so use your own output as the comparison.

Make sure `ark-multistage` and port 8080 are free, then run the smaller image
and check both its behavior and the files that shipped:

```text
docker run -d --name ark-multistage -e AUDIENCE="the release team" -p 127.0.0.1:8080:8000 ark-template:multistage
docker exec ark-multistage whoami
docker exec ark-multistage python -c "import jinja2, markupsafe._speedups; print(jinja2.__version__)"
docker exec ark-multistage sh -c "command -v gcc || echo no compiler"
docker inspect --format '{{json .Mounts}}' ark-multistage
```

Expect the `ark` user, Jinja2 version `3.1.6`, `no compiler`, and an empty
mount list. Open `http://127.0.0.1:8080/` and `/health`; the service should
still return its message and a successful health response. The extension
import confirms that the compiled dependency came across even though the
compiler did not.

The first `FROM` names the `build` stage. `pip install --prefix=/install`
places the packages in a directory that the second stage can copy with
`COPY --from=build`. That second `FROM` starts with a clean copy of the Python
base image, so files installed only in the build stage do not enter the
runtime image. Deleting the compiler later in a single-stage recipe hides it
from the final view, but its earlier layer still contributes to the image.

You can ask the builder for just the intermediate stage:

```text
docker buildx ls
docker build --target build -f Dockerfile.multistage -t ark-template:build .
docker run --rm ark-template:build ls /install/lib/python3.12/site-packages
docker image rm ark-template:build
```

Expect Jinja2 and MarkupSafe package directories. This target contains the
compiler and exists for build inspection, not deployment. Remove the running
container and comparison tags before leaving this experiment:

```text
docker stop ark-multistage
docker rm ark-multistage
docker image rm ark-template:oversized ark-template:multistage
```

## Give pip a cache that outlives the step

Open `Dockerfile.cache-mount`. Its build stage prepares wheels, Python's
installable package format:

```dockerfile
FROM python:3.12-alpine AS wheels
RUN apk add --no-cache build-base
WORKDIR /build
COPY --chmod=644 requirements-compiled.txt ./requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    pip wheel --no-binary=MarkupSafe --wheel-dir=/wheels -r requirements.txt
```

`pip wheel` resolves the requirements and puts wheel files under `/wheels`
without installing them. The cache mount gives pip a reusable directory at
`/root/.cache/pip` during this step. BuildKit keeps it separately from image
layers, so it never ships and can survive between builds. BuildKit may reclaim
the cache, so the recipe must still succeed when it is empty.

The runtime stage installs those wheels from a temporary mount:

```dockerfile
FROM python:3.12-alpine AS runtime
RUN adduser -D ark
WORKDIR /app
RUN --mount=type=bind,from=wheels,source=/wheels,target=/wheels \
    pip install --no-cache-dir --no-index /wheels/*.whl
COPY --chmod=644 app.py serve.py ./
USER ark
CMD ["python", "/app/serve.py"]
```

The bind mount exposes the `wheels` stage's directory, read-only, for this
single `RUN`. `--no-index` prevents an internet lookup at installation time,
and `--no-cache-dir` avoids adding another package cache to the runtime layer.
When the operation ends, the mount disappears; only the installed packages
remain in the image.

Build the cache-mount variant, then change `requirements-compiled.txt` by
adding a comment and build again with plain progress:

```text
docker build -f Dockerfile.cache-mount -t ark-template:cache-mount .
docker build --progress=plain -f Dockerfile.cache-mount -t ark-template:cache-mount .
```

The changed file invalidates the `pip wheel` operation, so the layer cache
cannot skip it. The log should show pip using packages from its cache instead
of downloading them again. These caches solve different problems: a layer
cache skips an unchanged operation, while a package cache can make a repeated
operation cheaper. Restore `requirements-compiled.txt` by removing your
comment, then remove the tag:

```text
docker image rm ark-template:cache-mount
```

The cache mount remains in the builder's cache, which `docker builder du`
reports. Leave it available to other builds; `docker builder prune` can
remove unrelated work. The official
[multi-stage guide](https://docs.docker.com/build/building/multi-stage/),
[cache optimization guide](https://docs.docker.com/build/cache/optimize/)
and [BuildKit overview](https://docs.docker.com/build/buildkit/) cover more
builder features.
