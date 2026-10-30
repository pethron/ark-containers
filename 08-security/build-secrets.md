---
title: "Build-time secrets"
track: runbook
---

# Build-time secrets

A private package server may require authentication while pip installs a
dependency. That makes the builder part of the security boundary: decide
which build can access the credential, how long it needs access, and what the
build command might write while using it. BuildKit can lend a secret to a
single build step through a **secret mount**, so let's see what that protects
and where its protection ends.

Use Linux Bash or PowerShell 7 with Linux containers. Linux Engine may require
`sudo` for Docker commands. The examples use a dummy marker; you need no
registry account or real secret, and you shouldn't use one here. From the
course checkout root, change to the packaged service:

=== "Linux (Bash)"

    ```bash
    cd 04-building-images/message-service
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Location .\04-building-images\message-service
    ```

## A step that needs a secret

Open `Dockerfile.secret`. It extends the original recipe with one step:

```dockerfile
RUN --mount=type=secret,id=lab,required=true \
    test -s /run/secrets/lab
```

The mount makes a secret supplied by the client available at
`/run/secrets/lab` only while that operation runs. `required=true` rejects
a missing input, and `test -s` rejects an empty file, standing in for a real
command that would authenticate with it. Predict the result when nothing
supplies that ID, then run:

```text
docker build --no-cache -f Dockerfile.secret -t ark-message:secret .
```

Expect a build failure identifying the missing secret. `--no-cache` forces
the instruction to execute for this diagnosis; otherwise an earlier successful
result could be reused without asking for the secret again.

Create a harmless marker and supply it separately from the context:

=== "Linux (Bash)"

    ```bash
    printf '%s\n' 'PUBLIC-LAB-MARKER' > demo.secret
    docker build --no-cache -f Dockerfile.secret --secret "id=lab,src=demo.secret" -t ark-message:secret .
    ```

=== "Windows (PowerShell)"

    ```powershell
    Set-Content -Path .\demo.secret -Value 'PUBLIC-LAB-MARKER' -Encoding utf8
    docker build --no-cache -f Dockerfile.secret --secret "id=lab,src=demo.secret" -t ark-message:secret .
    ```

`--secret` maps the host file to the ID used by `RUN`.
The `.dockerignore` excludes `*.secret` from the ordinary build context,
so the file reaches the build only through the explicit secret channel.
This build should succeed.

## Check what the image kept

Look for the secret in the resulting filesystem and history:

```text
docker run --rm ark-message:secret sh -c "test ! -e /run/secrets/lab && test ! -e /app/demo.secret"
docker image history --no-trunc ark-message:secret
```

The first command should succeed silently because both paths are absent.
The history records the instruction and the secret's ID, without the marker.
These checks cover this example's paths and commands; they wouldn't detect
another instruction copying the value into an unrelated file or log.
A secret mount controls how the input is delivered, while the command in
the step still decides where it writes its output.

## Secrets and the build cache

Change the dummy marker in your editor and build again without `--no-cache`:

```text
docker build -f Dockerfile.secret --secret "id=lab,src=demo.secret" -t ark-message:secret .
```

The secret-consuming step can say `CACHED`, because **secret contents don't
invalidate the build cache**. After rotating a real credential, a cached
step could therefore skip the work you expected to authenticate again.
To run it with the new input in this example, repeat the `--no-cache`
command. In a larger build, a non-secret revision argument consumed by
the relevant step can trigger a targeted refresh; never put the credential
itself in that argument.

## Clean up

Remove the tag and the dummy file:

```text
docker image rm ark-message:secret
```

=== "Linux (Bash)"

    ```bash
    rm demo.secret
    ```

=== "Windows (PowerShell)"

    ```powershell
    Remove-Item .\demo.secret
    ```

The official [secret mount guide](https://docs.docker.com/build/building/secrets/)
also covers secrets supplied from environment variables and SSH agent
forwarding for builds that clone private repositories.
