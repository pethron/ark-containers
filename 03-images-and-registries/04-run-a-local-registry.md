---
title: "Run a local registry"
track: runbook
---

# Run a local registry

An archive works for a small handover. For repeated delivery, let's put the
identified image in a registry and retrieve it by content reference. We'll
keep the registry on loopback and disposable: no cloud account or published
internet endpoint is needed.

## Reserve only this lab's resources

Use Bash from the course root, a local Linux Docker Engine or integrated
Desktop, and curl. Native rootful Engine commands may need `sudo`.
This lab creates:

- container `ark-registry`, bound only to `127.0.0.1:15000`;
- named volume `ark-registry-data`, holding uploaded registry content;
- local tags under `127.0.0.1:15000/ark/runtime`;
- the handover tag/archive from chapter 01, if you kept them.

Check those exact names with `docker ps -a`, `docker volume ls` and
`docker image ls`. Proceed only when the container and volume names are unused.
Don't reuse another registry's data directory. Port 15000 must be free.
The registry needs additional disk for image content even if the engine already
has the source image.

## Start the registry

```bash
docker volume create ark-registry-data
docker run -d --name ark-registry \
  --mount type=volume,source=ark-registry-data,target=/var/lib/registry \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:5000 \
  -p 127.0.0.1:15000:5000 \
  docker.io/library/registry:3
docker logs --tail 20 ark-registry
```

Then check the registry:

```bash
curl http://127.0.0.1:15000/v2/
```

Expect an HTTP success, normally `{}`. If it is still starting, wait a moment
and try again; if failure persists, read the registry logs.
The registry image uses its default user so it can initialize its new volume;
this is not the least-privilege configuration we'll use as a production template.

The loopback-only lab is deliberately unauthenticated HTTP. Docker normally
allows loopback registries without adding a broad insecure-registry rule.
If your organization enforces a different daemon policy, use an approved lab
environment rather than disabling TLS checks globally.

With a remote engine, the image reference's loopback address belongs to that
engine host. This walkthrough assumes a local setup; an SSH browser tunnel
alone doesn't redefine where the daemon pushes image blobs.

## Publish a name and record the content reference

```bash
docker tag ark-runtime:handover 127.0.0.1:15000/ark/runtime:handover
docker push 127.0.0.1:15000/ark/runtime:handover
docker image inspect 127.0.0.1:15000/ark/runtime:handover --format \
  'id={{.Id}} repository-digests={{json .RepoDigests}}'
```

If you removed `ark-runtime:handover`, restore it with the archive or tag the
verified local Python image again. Record the **digest reported by this push
for this repository**. Don't blindly reuse an unrelated Docker Hub index digest:
what you pushed may represent locally available platform content, not the
entire original multi-platform index.

Copy the actual pushed digest into the variable below:

```bash
pushed_digest='sha256:REPLACE_WITH_THE_DIGEST_FROM_THIS_PUSH'
docker image rm 127.0.0.1:15000/ark/runtime:handover
docker pull "127.0.0.1:15000/ark/runtime@$pushed_digest"
docker image inspect "127.0.0.1:15000/ark/runtime@$pushed_digest" --format \
  'id={{.Id}} platform={{.Os}}/{{.Architecture}}'
```

Compare the retrieved image ID and intended platform to chapter 01's notes.
Removing one repository tag didn't wipe shared local layers; this is a
registry-reference round trip, not proof that the engine redownloaded every
byte. For a cold-cache test, use another compatible disposable engine rather
than pruning a shared machine.

## Use what you retrieved

Repeat your known service launch with the immutable local-registry reference
as its image input. Verify the configured message and `/health` endpoint.
Keep the source mounts: we still haven't packaged our own application.
Which evidence now tells your colleague what runtime content to retrieve?

Notice the two different tests: the registry's `/v2/` check established that
its API responded; the service's `/health` check established something about
our application. One can't replace the other.

## Clean up intentionally

Stop and remove any service instance you created from this registry reference.
Remove only the lab tag/digest references that `docker image ls --digests`
shows for `127.0.0.1:15000/ark/runtime`; don't force-remove a shared image ID.
If a reference is in use, inspect that dependency before removing it.

```bash
docker stop ark-registry
docker rm ark-registry
docker volume inspect ark-registry-data
docker volume rm ark-registry-data
```

The final command deliberately deletes this lab's uploaded registry content.
The volume survives stopping/removing the container until you explicitly remove
it. Your cached Python and registry images may remain, as do the handover
archive and source files unless you separately remove their exact paths.
No global prune or daemon restart is needed.

Next, [registry behavior and authentication](05-registry-contract-and-authentication.md)
explain what this intentionally small deployment leaves out.
