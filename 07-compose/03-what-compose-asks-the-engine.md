---
title: "What Compose asks the engine"
track: architecture
---

# What Compose asks the engine

Changing the frontend's port made Compose replace the frontend while the API
kept running. We could see the result in `docker compose up`, but the engine
still did the work of stopping and starting containers. Let's inspect the
information Compose keeps and watch that work happen once more.

## Find the project's labels

The previous chapter left the stack running and restored the original port in
`compose.yaml`. From `07-compose/stack`, inspect both containers:

```text
docker inspect --format '{{json .Config.Labels}}' ark-api-1
docker inspect --format '{{json .Config.Labels}}' ark-web-1
docker compose config --hash api
docker compose config --hash web
```

In the labels, find `com.docker.compose.project`,
`com.docker.compose.service` and `com.docker.compose.config-hash`. The first
two identify the project and service; the hash represents the configuration
Compose recorded for that service. The `config --hash` output lets you
inspect a hash of the current service configuration. Hashes can vary with
Compose versions and configuration, so compare values in your own run rather
than copying a sample.

If you chose a project name other than `ark`, use its container names here
and its project name in the event filter below.

## Watch one change

Open a second host terminal and watch container events for this project:

```text
docker events --filter type=container --filter label=com.docker.compose.project=ark
```

Back in the first terminal, add one harmless setting under the **web**
service's existing `environment` section in `compose.yaml`:

```yaml
      INSPECTION_NOTE: "Ready for review"
```

This setting is only a marker for our inspection; the application doesn't
use it. Before starting anything, predict which service's configuration hash
will change:

```text
docker compose config --hash api
docker compose config --hash web
docker compose up -d
```

The web hash should differ from the value you recorded, while the API's
should stay the same. Compose recreates the frontend to apply its changed
environment and leaves the unchanged API running. Look at the event stream
for the frontend's stop, removal, creation and start; timing and extra events
vary. Stop the event stream with Ctrl+C, then check the result:

```text
docker compose exec web printenv INSPECTION_NOTE
docker inspect --format '{{json .Config.Labels}}' ark-web-1
```

The marker should read `Ready for review`; the new container has a project,
service and configuration label of its own. Open
`http://127.0.0.1:8080/` and confirm that the frontend still returns the API's
response. If you selected another host port earlier, use that port instead.

Compose uses configuration and image information to decide what needs
recreation. A hash is a comparison aid, not the container ID or a security
check, and options such as `--force-recreate` can request a replacement even
when the configuration hasn't changed. The Docker client talks to the same
engine you inspected in module 02; Compose coordinates a group of engine
operations instead of requiring you to type each one yourself.

## Leave a clean handover

Remove the `INSPECTION_NOTE` line you added and save the file. Then stop this
project:

```text
docker compose down
```

The containers and project network are removed; named volumes, if you added
any, remain. Images remain available too. The
[Compose kata](katas/README.md) starts from the supplied two-service file and
asks you to add the notes service without losing its data.
