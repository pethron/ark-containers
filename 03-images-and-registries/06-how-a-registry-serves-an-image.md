---
title: "How a registry serves an image"
track: architecture
pagination_next: 03-images-and-registries/katas/README
---

# How a registry serves an image

Our colleague can load the archive without an internet connection. If several
colleagues need frequent updates, passing a new file to each one becomes
awkward. A registry gives them a shared place to retrieve an image, but how
does a name such as `ghcr.io/pethron/ark-message:1` turn into the content
we just inspected?

## Follow the pull

A `docker pull` request goes from the client to the engine, which contacts
the named registry and resolves the tag to an index or manifest. For our
multi-platform image, the engine selects a suitable platform manifest, then
retrieves its configuration and layer blobs by digest. Content already
present locally can be reused. Docker prepares the image for use, and
starting the application remains a separate operation.

The OCI distribution specification describes a common HTTP interface for
exchanging those objects. The image specification describes the image
objects themselves. Agreeing on formats helps different tools exchange
content, while compatibility with the receiving platform still needs checking.

## See an anonymous challenge

Even a public registry can ask a client to obtain a short-lived token before
serving an image. With internet access, inspect the response to a request for
our public manifest. This command sends no account credentials:

=== "Linux (Bash)"

    ```bash
    curl --head https://ghcr.io/v2/pethron/ark-message/manifests/1
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe --head https://ghcr.io/v2/pethron/ark-message/manifests/1
    ```

GHCR normally responds with `401 Unauthorized` and a `WWW-Authenticate`
header naming a token service and a scope such as
`repository:pethron/ark-message:pull`. This first response is a **challenge**:
it tells a registry client how to request access. In this case Docker can
obtain an anonymous token for the public pull and retry; you don't need to
print or save that token. The manifest inspection in the previous chapter
exercised the client's registry path.

**Authentication** establishes an identity or obtains an access token;
**authorization** decides which action is permitted on a repository. A
public pull may be authorized anonymously, while a private repository or
push requires suitable credentials and permissions. A denial after the
client has attempted the challenge is different from the initial challenge.
If the header or status differs, check the actual response and registry
policy rather than assuming this example describes every registry.

## Leave the handover ready

You now have the archive, tag, full local ID, tested platform and launch
command. Include the message setting, since it was supplied at container
creation. The [local handover kata](katas/README.md) lets you put those pieces
together for an audience of your choice. Publishing your own build is a
separate [optional Docker Hub runbook](../04-building-images/optional/publish-to-docker-hub.md)
that needs an account; this handover doesn't.

When you're finished with the walkthrough, remove only your handover tag,
archive and empty directory. From the directory where you created them:

=== "Linux (Bash)"

    ```bash
    docker image rm ark-message:handover
    rm ark-image-handover/message.tar
    rmdir ark-image-handover
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker image rm ark-message:handover
    Remove-Item .\ark-image-handover\message.tar
    Remove-Item .\ark-image-handover
    ```

The course image and other work remain in place. If you haven't created the
archive, don't run its file-cleanup commands.
