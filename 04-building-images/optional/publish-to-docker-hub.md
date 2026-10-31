---
title: "Publishing to Docker Hub"
track: runbook
---

# Publishing to Docker Hub

Your colleague can load an archive, but now several people want the image
without waiting for you to send a file. Let's publish an application image
under your own Docker Hub namespace, retrieve the content you published and
check the same HTTP contract again. The course image you pulled in earlier
modules lives in the course's namespace on GitHub's registry; this one will
live in a namespace you control.

This is an optional handover route. You need Docker running Linux containers,
internet access, a Docker Hub account and permission to upload the supplied
code. The core kata still uses an archive and needs no account. Don't use a
team repository for this experiment unless its owner has approved it.

## Build an artifact worth sharing

Start from the [course checkout root](../../before-you-start.md#get-the-course-files), with no container named `ark-hub-check`
and loopback port 8080 free. Use the supplied module-04 recipe, or substitute
an image with the same HTTP contract that you built and tested yourself:

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\message-service
    ```

Read `Dockerfile` and `.dockerignore` before building. Which files will leave
your computer, and which settings will the image carry? The recipe copies
`app.py`, runs as `ark` and starts Python; its allowlist excludes unrelated
files. Inspect your own recipe just as carefully if you substitute it.
Never publish an image containing real credentials, even if a later build
step deleted their visible files.

Check that `ark-message:hub` is an unused tag, then build and record its
identity and platform:

```text
docker build --progress=plain -t ark-message:hub .
docker image inspect ark-message:hub --format 'id={{.Id}} platform={{.Os}}/{{.Architecture}}'
```

Keep that output in your handover notes. This is a build for the platform
selected by your builder; uploading it won't turn it into a multi-platform
image.

Before uploading, check the image locally:

```text
docker run -d --name ark-hub-check -e MESSAGE="A published ARK image" -p 127.0.0.1:8080:8000 ark-message:hub
docker inspect ark-hub-check --format '{{json .Mounts}}'
```

Open `http://127.0.0.1:8080/` and `/health`. Expect the message
`A published ARK image`, `{"status": "ok"}` and an empty mount list.
If startup hasn't finished, wait and retry; a persistent failure needs
`docker ps -a --filter name=ark-hub-check` and `docker logs ark-hub-check`
before any upload. Once those checks pass, remove this local test:

```text
docker stop ark-hub-check
docker rm ark-hub-check
```

!!! success "Checkpoint"

    `ark-message:hub` has a recorded platform and passes the HTTP checks
    with no mounts. The local test container is removed; keep the
    image for publication.

## Choose the repository and sign in

On Docker Hub, create an `ark-message` repository in your own namespace.
Choose its visibility deliberately: a public repository makes the artifact
available to others; a private one requires access for each recipient.
Use a different repository name if that name already belongs to your work.

Enter the username, not an email address, and prepare the reference:

=== "Linux (Bash)"

    ```bash
    read -r -p 'Docker Hub username: ' hub_user
    hub_ref="${hub_user}/ark-message:lab"
    ```

=== "Windows (PowerShell)"

    ```powershell
    $hub_user = Read-Host 'Docker Hub username'
    $hub_ref = "${hub_user}/ark-message:lab"
    ```

The namespace and repository choose the destination; `lab` is a tag within
it. If you chose another repository, change that reference before continuing.
Authentication establishes your identity, while the repository's policy
decides whether it may push there.

```text
docker login
```

Docker Hub's default login uses a device code and a browser sign-in. Follow
the displayed instructions rather than putting a password in a command.
Docker Desktop normally saves credentials through its credential store.
An Engine-only setup without a configured helper may instead save
base64-encoded credentials in the user's Docker configuration; that is not
encryption. Check the supported credential-store setup before proceeding
on a shared machine.

This changes the Docker client's login, not the application container.
Be deliberate if the terminal already uses another account. Docker also
supports token-based login through standard input; the
[login reference](https://docs.docker.com/reference/cli/docker/login/)
describes that alternative without making a literal secret part of this lab.
Keep passwords, tokens and device codes out of reports and screenshots.

!!! success "Checkpoint"

    The client reports a successful login for the intended account.
    You have selected your own repository and visibility, and `hub_ref`
    names its lab tag.

## Publish and retrieve the content

Tagging adds a local reference to the existing image. Compare the two IDs
before sending any content:

```text
docker tag ark-message:hub "$hub_ref"
docker image inspect ark-message:hub "$hub_ref" --format '{{.Id}}'
docker push "$hub_ref"
```

Expect the IDs to agree. A successful push reports a repository digest;
record the full value beginning with `sha256:`. Some layers may already exist
in the registry, so reused layers are not evidence that your upload failed.
Also check the repository's Tags page to see where the tag now points.

!!! success "Checkpoint"

    Both local references identify the same image. The push succeeded,
    the lab tag is visible in your repository and its reported digest is
    recorded in full.

Enter the digest returned by your push:

=== "Linux (Bash)"

    ```bash
    read -r -p 'Digest returned by the push: ' hub_digest
    hub_artifact="${hub_user}/ark-message@${hub_digest}"
    ```

=== "Windows (PowerShell)"

    ```powershell
    $hub_digest = Read-Host 'Digest returned by the push'
    $hub_artifact = "${hub_user}/ark-message@${hub_digest}"
    ```

Replace the repository name here too if you chose another one. The digest
must be complete, not an image ID copied from a different object.

```text
docker pull "$hub_artifact"
docker image inspect "$hub_artifact" --format 'platform={{.Os}}/{{.Architecture}} user={{.Config.User}}'
docker run -d --name ark-hub-check -e MESSAGE="A published ARK image" -p 127.0.0.1:8080:8000 "$hub_artifact"
```

The pull may reuse your engine's cached blobs. It still checks that the
registry can resolve the reference; it doesn't prove a cold download or
execution on a second machine. Compare the platform with your notes, then
open `http://127.0.0.1:8080/` and `/health`. Expect `A published ARK image`
and `{"status": "ok"}`. Inspect the container's mounts as well:

```text
docker inspect ark-hub-check --format '{{json .Mounts}}'
```

An empty list confirms that our source wasn't supplied by a host mount.
Your handover now contains a retrievable reference, its intended platform,
the message setting and the checks for the recipient. Test their machine
separately before claiming that it has been verified.

!!! success "Checkpoint"

    The digest reference resolves, its platform matches your notes, and
    `ark-hub-check` passes the message and health checks with no mounts.
    Keep the reference and launch settings for the recipient, then remove
    the lab resources below.

## Read a failure before changing the recipe

| Observation | Next question |
|-------------|---------------|
| Push denied | Did you log in as the expected account, and does it have write permission for this namespace? |
| Repository or manifest unknown | Is the reference spelled correctly, and was that content published? |
| TLS or connection error | Is the endpoint reachable with the configured proxy and trust policy? |
| No matching platform or executable-format error | Did you publish a build the receiving engine can run? |
| Container exits or HTTP fails | What do its state and logs say after the artifact was retrieved? |

A failed upload doesn't justify adding permissions to the application.
Resolve the client/repository problem and retry the same artifact.

## Leave only the handover

Stop and remove your test container:

```text
docker stop ark-hub-check
docker rm ark-hub-check
```

If you created the two tags only for this lab, remove those exact references:

```text
docker image rm "$hub_ref" ark-message:hub
```

The digest reference may remain cached; keep it if the handover still needs
it, or remove that exact reference with `docker image rm "$hub_artifact"`.
On Docker Hub, delete only the lab tag if it is no longer needed; don't
delete a repository containing other work. Use `docker logout` only if this
was a lab-only login that you intend to remove, not as a routine way to
erase an existing working account.

Return to the [build kata](../katas/README.md). Its archive acceptance remains
unchanged. Whichever transport you choose, the recipient needs the reference,
platform, launch settings and HTTP checks that make the handover useful.

## Further reading

- [Docker Hub image publication](https://docs.docker.com/docker-hub/repos/manage/hub-images/push/)
- [Docker login and credential stores](https://docs.docker.com/reference/cli/docker/login/)
