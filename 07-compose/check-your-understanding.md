---
title: "Check your understanding"
track: kata
---

# Check your understanding

The whole stack now lives in `compose.yaml`, and one command brings it up or
takes it down. Before you extend that file on your own, see whether you can
predict what Compose will do with it. Write down your answer to each question
first, then open the answer and compare the reasoning; a mismatch is a good
reason to reread the chapter it links to.

## 1. A URL copied from the manual setup

A colleague translating the manual commands into `compose.yaml` copied the
frontend's variable as it was:

```yaml
    environment:
      BACKEND_URL: http://ark-api:8000/health
```

After `docker compose up -d`, the page answers:

```json
{"service": "ark-web", "error": "name_resolution"}
```

Both containers are running on `ark_default`. Why can't the frontend find the
API, and what would you put in the URL?

<details>
<summary>Answer</summary>

In the manual setup, `ark-api` was a container name we chose ourselves. Under
Compose, the API's container is called `ark-api-1`, and the name meant for
other services is the service name from the file, `api`, which Compose
registers with Docker's name server on the project network. Nothing answers to
`ark-api`, so the lookup fails before any request is sent. Writing
`http://api:8000/health` fixes it, and keeps working whatever Compose decides
to call the container. See [Projects, networks and volumes in Compose](02-what-compose-manages-for-you.md#services-find-each-other-by-name).

</details>

## 2. What did they change?

A teammate edited `compose.yaml`, ran `docker compose up -d`, and sent you the
end of the output:

```text
 Container ark-api-1 Running
 Container ark-web-1 Recreate
 Container ark-web-1 Recreated
 Container ark-web-1 Starting
 Container ark-web-1 Started
```

What can you tell about the edit without opening the file, and why did the
API keep running?

<details>
<summary>Answer</summary>

The frontend was recreated while the API stayed running. A changed web
setting, such as its port or `BACKEND_URL`, is one possible explanation:
Compose needs a replacement to apply settings fixed at creation. A changed
image or a forced recreation can also produce this result, so the output
alone doesn't establish which edit happened. Compare the file, image and
command before concluding. See
[Projects, networks and volumes in Compose](02-what-compose-manages-for-you.md#up-compares-then-acts).

</details>

## 3. Your containers among many

Your machine also runs containers from other courses and projects. When you
run `docker compose down` in `07-compose/stack`, how does Compose know which
containers and which network to remove? And if you added a service called
`notes` to this file, what would its container be called?

<details>
<summary>Answer</summary>

Everything Compose creates belongs to a project, and `name: ark` sets that
project's name. Compose builds names from it and labels each object with the
project, which is how `docker compose ps` and `docker compose down` find
exactly your containers and the `ark_default` network while leaving everything
else alone. Following the same pattern of project, service and number, the new
container would be `ark-notes-1`. See [Projects, networks and volumes in Compose](02-what-compose-manages-for-you.md#everything-belongs-to-a-project).

</details>

## 4. A fresh start, or a clean slate?

Your stack now includes the notes service with its `notes-data` volume, and
the frontend is misbehaving. You want to throw the containers away and start
again, but the notes you saved last week matter. Which command do you run
before `docker compose up -d`, and when would the other choice be the right
one?

<details>
<summary>Answer</summary>

`docker compose down` is the safe choice here. It removes the project's
containers and network, keeps the images, and keeps named volumes such as
`ark_notes-data`, so the next `up` mounts the same volume and your notes are
still there. `docker compose down -v` also deletes the project's named
volumes, which makes sense when you really want an empty start, as at the end
of the kata, and never as a habit. See
[Projects, networks and volumes in Compose](02-what-compose-manages-for-you.md#what-down-removes-and-what-it-keeps).

</details>

## 5. Looking back: the note that didn't survive

Someone adds the notes service to the file but mounts the volume at
`notes-data:/notes`, while the service writes to `/data/notes.txt`. Adding a
note works, yet after `docker compose down` and `docker compose up -d` the
list is empty. Using what you learned about a container's own files in the
storage module, explain where the note went.

<details>
<summary>Answer</summary>

The service saved its note in `/data`, which in this setup is part of the
container's writable layer, since the volume sits at `/notes` where nothing is
written. `down` removed the container, and its writable layer went with it;
the volume survived, but it was empty all along. Mounting the volume at
`/data`, where the service actually writes, puts the notes in storage with its
own lifecycle. See [Where container files live](../05-storage/02-where-container-files-live.md#what-survives-what).

</details>

## 6. File or command?

You want to check something quickly in a single throwaway container, and later
you'll hand the two-service stack to a colleague for a demo. For which of the
two would you write a Compose file, and why? Would you ever choose otherwise?

<details>
<summary>Answer</summary>

The stack deserves the file. It has two services, a network, a variable and a
published port that must all agree, and the file records them in one place
that your colleague can read, review and start with one command. For a single
quick experiment, `docker run` is still fine, because there's little to
remember and nothing to hand over. If that experiment starts growing options
you'll want to repeat, that's a good moment to move it into a file. See
[Defining a stack with Compose](01-describe-the-stack-in-a-file.md#look-at-the-stack)
and the verdict at the end of
[Projects, networks and volumes in Compose](02-what-compose-manages-for-you.md#what-down-removes-and-what-it-keeps).

</details>

## 7. A new container with the same project

After changing one web setting, Compose recreates the frontend. Which labels
help associate the replacement with the same project and service, and does a
new configuration hash prove the application is healthy?

<details>
<summary>Answer</summary>

The `com.docker.compose.project` and `com.docker.compose.service` labels
identify its project and service, while the configuration hash helps Compose
compare settings. The hash isn't an application health check: request the
page and inspect logs when necessary. See
[What Compose asks the engine](03-what-compose-asks-the-engine.md#watch-one-change).

</details>

If these felt comfortable, try writing the third service yourself in the
[kata](katas/README.md), this time without a file to read from.
