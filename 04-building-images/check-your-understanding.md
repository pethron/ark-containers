---
title: "Check your understanding"
track: kata
---

# Check your understanding

By now the message service travels as a single image that carries its code,
its user and its start command. Each of the questions below picks one decision
from that recipe and asks you to predict, diagnose or justify it. Try to answer
in your own words before you open the answer, and treat a wrong guess as
directions: the link at the end of each answer leads to the chapter that
develops the idea.

## 1. An edit after the build

You've built `ark-message:first-build`, and now you change the default message
in `message-service/app.py` and save the file. You then start a new container
from `ark-message:first-build` without setting `MESSAGE`. Which message will
the page show, and what would you need to do to see your edit?

<details>
<summary>Answer</summary>

The page still shows the old default, `Hello from ARK`. `COPY` placed a copy
of `app.py` inside the image when you built it, and the container receives its
files from that image, while your editor changed the separate copy on your
computer. To deliver the edit, you build the image again and create a new
container from the result. Restarting an existing container wouldn't help
either, because it keeps the image it was created from. The experiment is in
[Build context and build cache](02-build-cache-and-build-context.md#follow-one-changed-file).

</details>

## 2. Reading a rebuild log

After a small edit in `template-service`, a build with `--progress=plain`
ends like this:

```text
#6 [3/6] WORKDIR /app
#6 CACHED

#7 [4/6] COPY --chmod=644 requirements.txt ./
#7 CACHED

#8 [5/6] RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt
#8 CACHED

#9 [6/6] COPY --chmod=644 app.py serve.py ./
#9 DONE 0.0s
```

Which of the two recipes produced this log, and which file did you edit? What
would the same edit have done to the other recipe?

<details>
<summary>Answer</summary>

This is the supplied `Dockerfile`, which copies `requirements.txt` on its own,
installs the packages and copies the application files afterward. The
dependency steps are cached, so the list didn't change, while the final copy
ran again, so the edit touched `app.py` or `serve.py`. `Dockerfile.baseline`
copies all three files in one step before `pip install`, so the same edit would
have changed the input to the installation and pip would have run again. The
order of the steps decides which work an ordinary source edit repeats, as you
can see in
[Dependencies and layer caching](05-dependencies-and-build-cache.md#put-each-input-where-it-belongs).

</details>

## 3. A file the build can't find

In your own build directory, a teammate tidies up `.dockerignore` and removes
the `!app.py` line. The next build stops at the `COPY` step, complaining that
`app.py` can't be found, yet the file is right there in your editor. What's
going on, and why is it not worth looking for a Python problem?

<details>
<summary>Answer</summary>

The first pattern, `*`, excludes everything, and `!app.py` was the line that
let the application back into the build context. Without it, Docker leaves the
file out of what it sends to the builder, so `COPY` can't find its source even
though the file exists on your computer. The build hadn't started Python yet,
so the error is evidence about the context and its exclusions. Restoring the
line makes the file available again, and Docker can reuse its earlier cached
result. The experiment is in
[Writing a Dockerfile](03-write-the-services-dockerfile.md#diagnose-a-missing-input).

</details>

## 4. Passing --version to two images

The supplied `Dockerfile` records `CMD ["python", "/app/app.py"]` and no
entrypoint, while `Dockerfile.exec` records `ENTRYPOINT ["python"]` and
`CMD ["/app/signal-server.py"]`. Predict what each of these commands does:

```text
docker run --rm ark-message:exec --version
docker run --rm ark-message:first-build --version
```

<details>
<summary>Answer</summary>

With the exec image, `--version` replaces `CMD` while the entrypoint stays, so
Docker runs `python --version` and prints the Python version. With
`ark-message:first-build`, the words after the image name replace the whole
default command, so Docker tries to run `--version` as a program and the
container fails to start. To get the version from that image you would write
`python --version` in full, as the chapter does. Neither design is wrong: an
entrypoint suits an image that behaves like one executable, while a complete
`CMD` is handy when people may replace the command for diagnostics, as long as
you document the one your users will meet. The rules are in
[CMD, ENTRYPOINT and stop signals](04-commands-and-signals.md#one-instruction-runs-now-two-record-a-later-start).

</details>

## 5. A stop that takes the whole grace period

A colleague's container takes the full grace period every time they run
`docker stop`, and its log never mentions receiving a signal. They show you its
process listing:

```text
PID   USER     TIME  COMMAND
    1 ark       0:00 sh -c python /app/signal-server.py & wait
    7 ark       0:00 python /app/signal-server.py
    8 ark       0:00 ps
```

The application has a handler for TERM. Why doesn't it run, and what change
would you suggest?

<details>
<summary>Answer</summary>

Docker sends the stop signal to the container's main process, PID 1, and here
that's the shell, with Python running as its child. This wrapper doesn't
forward TERM, so Python never hears about the stop and Docker forces the
container to end once the grace period runs out. The simplest fix for a single
service is the exec form, `CMD ["python", "/app/signal-server.py"]`, which
makes Python PID 1. If the shell has real startup work to do, ending it with
`exec python /app/signal-server.py` replaces the shell with Python, so the
signal reaches the application. The comparison is in
[CMD, ENTRYPOINT and stop signals](04-commands-and-signals.md#follow-the-process-that-receives-stop).

</details>

## 6. Who should own the code?

While reviewing your recipe, a teammate suggests making `ark` the owner of
`/app/app.py`, "so we never get permission errors". The file is currently
owned by root with permissions `644`, and the service starts fine. Would you
accept the change?

<details>
<summary>Answer</summary>

I'd keep the current setup. With `644`, root may read and write the file while
everyone else, `ark` included, may only read it, and reading is all Python
needs to start the service. Making `ark` the owner would also let the process
rewrite the code it runs, a right this service never uses and one you'd rather
not hand to a bug or an attacker who takes control of it. A permission error
at startup usually points to a missing read permission or a wrong path, which
you can fix without granting write access. The permissions are checked in
[Building and running your first image](01-package-the-service-in-an-image.md#what-ark-can-do-with-its-code).

</details>

## 7. Looking back: a new name or a new image?

In the previous module, you gave the course image a second name with
`docker tag ghcr.io/pethron/ark-message:1 ark-message:handover`. In this
module, `docker build` produced `ark-message:first-build` from the same recipe
the course uses for that image. Which of the two local references shares an ID
with `ghcr.io/pethron/ark-message:1`, and why?

<details>
<summary>Answer</summary>

`ark-message:handover` is guaranteed to share the ID: `docker tag` adds
another reference to content Docker already has. A build follows a recipe
and may produce different content or configuration when its inputs or build
details differ. If those happen to match, it can also produce the same ID, so
inspect the result instead of assuming either outcome. The tagging experiment is in
[Image names, tags and IDs](../03-images-and-registries/02-one-image-several-names.md#give-the-image-a-local-handover-name),
and the comparison with a build in
[Building and running your first image](01-package-the-service-in-an-image.md#your-build-and-the-course-image).

</details>

## 8. Two kinds of build cache

A package-installation step has to run again after its inputs change. What
could a cache mount still save, and why should the build work if that cache
is empty?

<details>
<summary>Answer</summary>

A cache mount can retain package-manager downloads or other reusable data
even when BuildKit cannot skip the whole operation. It is separate from the
image output and may be empty or reclaimed, so the build must still obtain
what it needs without relying on a warm cache. See
[A cache for work that runs again](06-what-buildkit-does.md#a-cache-for-work-that-runs-again).

</details>

If you'd like to make these decisions for a receiver of your own, the
[packaging kata](katas/README.md) sets the constraint and leaves the recipe
to you.
