---
title: "Check your understanding"
track: kata
---

# Check your understanding

Your colleague now has an archive, a tag, an ID and a launch command, and each
of those pieces exists for a reason you met in this module. The questions
below ask you to recall those reasons. Answer each one from memory before
opening the answer; there's no score to keep, and if your guess turns out
wrong, the link at the end of the answer points to the chapter worth rereading.

## 1. What goes into message.tar?

Imagine you're about to run `docker image save` on `ark-message:handover`.
Your service has been using Python and its supporting files, `app.py`, the
`MESSAGE` value from the launch command and, in an earlier experiment, a note
written to `/tmp/ark-note` inside a running container. Which of these will
your colleague find in the archive, and where does each of the others live?

<details>
<summary>Answer</summary>

Python, its supporting files and `app.py` all travel in the archive, because
they're files in the image's layers, together with the image's configuration
defaults, such as the command that starts the server, and its tag. The message
is a setting you pass when creating the container, so it lives in the launch
command. The note was written to one container's writable filesystem, so it
stays with that container and a fresh one starts without it. That's why the
handover still needs the full launch command alongside the archive. Where each
piece comes from is laid out in
[Image layers](03-what-an-image-contains.md#the-containers-files-are-a-different-lifetime).

</details>

## 2. Two IDs that don't match

A few weeks after creating a stopped container called `ark-image-check`,
you compare it with the image name it was created from:

```text
docker image inspect --format '{{.Id}}' ghcr.io/pethron/ark-message:1
docker inspect --format '{{.Image}}' ark-image-check
```

The two commands print these values, in that order:

```text
sha256:b7234bc161d538ca62c78da1bb1826700faf5b8eaabc7605f26699fc1b6774b1
sha256:7d27c08e729156819fb74f85193f27421131f7f774bf66f7cc9aa24ffa2d892a
```

On the day you created the container, the two values matched. What is the
most likely explanation, and should you worry about the container?

<details>
<summary>Answer</summary>

Most likely someone pulled `ghcr.io/pethron/ark-message:1` again in the
meantime and the publisher had moved that tag to a corrected build. A container
records the ID of the image it was created from, so `ark-image-check` still
points to the
original content while the tag now leads somewhere else. Nothing is broken:
the container is simply older than the tag's current target. This is the
reason we record a full ID next to the readable name, since only the ID tells
you which content you actually tested. The comparison is introduced in
[Finding and running local images](01-find-the-image-behind-the-container.md#run-a-job-from-the-local-image).

</details>

## 3. A password that was deleted

A teammate shows you an image whose recipe added a configuration file
containing a database password, then removed that file in a later step.
Starting a container and listing the directory shows no trace of it, so they
suggest it's safe to put the image in an archive for an external partner.
Would you agree?

<details>
<summary>Answer</summary>

I wouldn't. An image's files are built from a sequence of layers, and a later
layer can hide a file from the view a container receives while its bytes stay
in the earlier layer. The archive carries all of those layers, so anyone who
receives it may be able to dig the password out. The listing inside the
container only shows the final view, which is why it looked clean. The safe
course is to keep secrets out of every step from the start and to treat this
password as exposed if the image has already travelled. The consequence is
discussed in
[Image layers](03-what-an-image-contains.md#files-arrive-in-layers).

</details>

## 4. Writing the message for an arm64 laptop

Your inspection after loading the archive printed `linux/amd64`, and you've
just learned that your colleague's laptop has an arm64 processor. You've
already written the tag and the launch command in your message. What else
would you add, and why isn't the tag enough on its own?

<details>
<summary>Answer</summary>

Add the full local image ID and the platform you tested. The tag is a
convenient name for commands, but it can be reassigned, while the ID lets your
colleague check that the image they loaded is the one you ran. The platform
tells them that this build targets `linux/amd64`, so on an arm64 machine
they'll need a compatible build or an environment with suitable emulation
before launching. It's also honest to say that you tested the archive on your
own engine, leaving their machine as a separate check. Both points are
developed in
[Tags, digests and platforms in a handover](05-choose-the-reference-to-hand-over.md#check-the-receiving-platform).

</details>

## 5. Archive or registry?

Your service is about to get frequent updates, and three colleagues want to
keep up with them. Would you keep sending archives, or set up a registry?
Think about what each option asks of you and of them, and note that both
answers can be reasonable.

<details>
<summary>Answer</summary>

With several people and frequent changes, a registry starts to pay off: you
`push` each update once to a shared place, and everyone can `pull` the
reference they need instead of waiting for a file. It does bring decisions of
its own, such as where the registry lives and who may access each repository,
since a private repository asks for authentication through `docker login`.
An archive remains a perfectly good choice for a single handover, an offline
machine or a quick exchange where nobody wants to manage a registry. The
trade-off is discussed in
[Tags, digests and platforms in a handover](05-choose-the-reference-to-hand-over.md#where-a-registry-fits).

</details>

## 6. Which object did you compare? (optional)

After the optional manifest investigation, a colleague compares the image ID
printed by `docker image inspect` with
a digest from `docker manifest inspect` for the course image. They differ,
so the colleague concludes that the download was corrupted. What question
would you ask before accepting that conclusion?

<details>
<summary>Answer</summary>

Ask which object each value identifies. An index, a platform manifest and
an image configuration describe different levels of the artifact, so their
digests need not match. The local ID also depends on the engine's image store.
First identify the objects and the selected platform, then compare like with
like. A successful application response answers another question again:
whether that artifact works with the launch settings you supplied.
The optional [manifest explanation](../advanced/images-and-distribution/digests-manifests-and-multi-arch-images.md)
follows those objects; the archive exercise needs only the local comparison
already made in this module.

</details>

## 7. Looking back: a port already in use

Your colleague tells you that something on their computer already uses port
8080. The launch command in your notes publishes the service with
`-p 127.0.0.1:8080:8000`. Which of the two numbers should they change, and why
can the other one stay as it is?

<details>
<summary>Answer</summary>

They should change the first number, the port on their computer, for example
to `127.0.0.1:8081:8000`, and then open that address. The second number is
the port the application listens on inside the container, and the service
keeps listening on 8000 wherever it runs, so changing it would forward requests to a
port where nothing is waiting. Each container has its own port 8000, which is
how two copies of the service could run side by side in module 01 with
different host ports. The idea comes from
[When a running container doesn't answer](../01-why-containers/05-running-but-unreachable.md#a-second-copy-for-your-colleague).

</details>

When you're ready to put the whole handover together with less guidance, try
the [local handover kata](katas/README.md).
