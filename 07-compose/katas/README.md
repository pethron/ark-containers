---
title: "Kata: add the notes service"
track: kata
---

# Kata: add the notes service

Your colleague liked the handover and asks for one more thing: the notes
service should start with the rest of the application. And since notes are
worth keeping, they must survive the next `down` and `up`.

Your job is to extend `07-compose/stack/compose.yaml` with a third service.
Write it yourself from what you know about the notes service and the two
services already in the file.

## Before you start

You need Docker running Linux containers with Compose and curl (`curl.exe`
on Windows). Work from `07-compose/stack`. Its `compose.yaml` already runs
two services: `api`, a small API, and `web`, a frontend published on
`127.0.0.1:8080` that calls the API at the address in `BACKEND_URL`.

The supplied [notes service](../stack/notes-service/README.md) sits next to
the file, in `notes-service`. It's a small web service that listens on port
`8000`, saves the body of a `POST /notes` request as a note and lists the
notes on `GET /notes`. It writes them to `/data/notes.txt` inside its
container.

The kata uses the Compose project `ark`: containers `ark-api-1`,
`ark-web-1` and `ark-notes-1`, the network `ark_default`, the volume
`ark_notes-data` if you name it `notes-data`, and local ports `8080` and
`8081`. Check `docker ps -a` and `docker volume ls` first: those names and
ports must be free.

## The requirements

The new service must:

- build from the `notes-service` directory next to `compose.yaml`;
- be reachable at `http://127.0.0.1:8081/notes`, and only from your computer;
- keep its notes in a named volume mounted at `/data`.

Leave the `api` and `web` services as they are.

## Check your work

From `07-compose/stack`, start the stack and add a note:

=== "Linux (Bash)"

    ```bash
    docker compose up -d --build
    curl -d "Water the plants" http://127.0.0.1:8081/notes
    ```

=== "Windows (PowerShell)"

    ```powershell
    docker compose up -d --build
    curl.exe -d "Water the plants" http://127.0.0.1:8081/notes
    ```

If curl can't connect, the service is still starting: wait a second and
retry.

You're done when all of these are true:

- `http://127.0.0.1:8080/` still answers with both `ark-web` and `ark-api`.
- After `docker compose down` and `docker compose up -d`,
  `http://127.0.0.1:8081/notes` still lists your note.
- `docker compose ps` shows published ports only for `web` and `notes`,
  both bound to `127.0.0.1`.

Before running `down`, predict which objects Compose will remove and which
it will keep. Compare your prediction with its output.

<details>
<summary>Hint 1: copy the shape you know</summary>

The `web` service already shows `build` and `ports`. The `build` path is
relative to `compose.yaml`, like `./network-service` for the other two.

</details>

<details>
<summary>Hint 2: two places for one volume</summary>

A named volume appears twice: under the service's `volumes`, as
`name:/data`, and in a top-level `volumes` section that declares the name.
[Chapter 02](../02-what-compose-manages-for-you.md) shows the shape.

</details>

<details>
<summary>Hint 3: if the note disappears</summary>

Check `docker volume ls` after `down`. If no volume with the project prefix
remains, the service is probably writing to its container's own filesystem:
compare the mount target with the directory where the service saves notes.

</details>

## Reset the kata

When you're done, remove the stack and, this time on purpose, its volume:

```text
docker compose down -v
```

That leaves nothing running and no project volume; only the built images
remain. If you want to keep the file as it was, undo your changes to
`compose.yaml` afterwards.

Continue to [Check your understanding](../check-your-understanding.md)
before moving on to the reading-list application.
