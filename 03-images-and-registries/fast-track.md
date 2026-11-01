---
title: "Fast track: hand over an image"
track: runbook
---

# Fast track: hand over an image

A colleague has Docker but no network access on their lab machine. We'll
give the course image a handover tag, save it to a file, restore it and
check the service using only the restored image.

Use Docker with Linux containers, `tar`, and a browser or curl from
[Before you start](../web/before-you-start.md). No course files or registry
account are needed. On Linux Engine, prefix Docker commands with `sudo` if
required by your setup. Check `docker image ls ark-ft-handover` and
`docker ps -a`: the tag `ark-ft-handover:1`, container `ark-ft-image` and
loopback port 8080 must be free. Choose unused alternatives if needed.

## Name and save

Inspect the course image and record its full ID and platform. If the image
is missing, download it first with `docker pull ghcr.io/pethron/ark-message:1`.
Give it a second name and compare the IDs:

```text
docker image inspect --format '{{.Id}} {{.Os}}/{{.Architecture}}' ghcr.io/pethron/ark-message:1
docker tag ghcr.io/pethron/ark-message:1 ark-ft-handover:1
docker image inspect --format '{{.Id}} {{.Os}}/{{.Architecture}}' ark-ft-handover:1
```

The IDs and platforms should match. In a directory where you can create
files, make a **new** folder for the archive. If `ark-ft-image-handover`
already exists, choose another name and remember it for the handover:

```text
mkdir ark-ft-image-handover
cd ark-ft-image-handover
docker image save --output message.tar ark-ft-handover:1
tar -tf message.tar
```

!!! success "Checkpoint"

    `message.tar` exists and the listing includes `manifest.json`. If
    saving or listing fails, stop and investigate before removing the tag.

## Restore and run

Remove only the handover tag, then load it from the archive and compare
the result with the ID and platform you recorded:

```text
docker image rm ark-ft-handover:1
docker image load --input message.tar
docker image inspect --format '{{.Id}} {{.Os}}/{{.Architecture}}' ark-ft-handover:1
docker run -d --name ark-ft-image --pull never -e MESSAGE="Loaded from the handover" -p 127.0.0.1:8080:8000 ark-ft-handover:1
docker inspect --format '{{.Image}}' ark-ft-image
```

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

!!! success "Checkpoint"

    The restored ID and platform match your notes; the container reports
    that ID and answers `Loaded from the handover` and `ok`. Retry if it is
    still starting. This checks restoration on your engine; your colleague's
    compatible machine is a separate test.

With internet access, `docker buildx imagetools inspect
ghcr.io/pethron/ark-message:1` lists the platforms published under the
registry tag. If Buildx is unavailable, `docker manifest inspect
ghcr.io/pethron/ark-message:1` shows the registry's JSON instead.
Entries marked as attestations can appear as `unknown/unknown`; they are
metadata rather than additional runnable platforms.

## Finish

Remove the test container and your extra tag, then return to the parent
directory:

```text
docker stop ark-ft-image
docker rm ark-ft-image
docker image rm ark-ft-handover:1
cd ..
```

The course image remains available, and `ark-ft-image-handover/message.tar`
is yours to send. When you no longer need it, delete that archive and its
folder if the folder is empty. The
[guided handover](01-find-the-image-behind-the-container.md) and
[kata](katas/README.md) give you more practice with the artifact and its
receiving requirements.
