# Kata: a second team's reading list

A second team wants its own reading list on the same Docker engine. They
can use the supplied application, but their records must stay separate from
the first team's, including after a container replacement and a restore.
They have also sent an incomplete incident report: “The page loads, but the
list won't refresh.” You need enough evidence to decide where to investigate.

Use the [guided stack](../README.md) as the first team on project `ark-reading`
and loopback port 8080. For the second team, copy the supplied application
source into a new working directory of your choice under this module, keeping
credentials and backups private. Replace the copied base Compose file with
[`compose.starter.yaml`](compose.starter.yaml), saved as `compose.yaml` in
that copied application directory. The starter supplies builds, database
settings and secret mounts; you own the missing storage, topology and
readiness decisions.

Choose an unused project name such as `ark-reading-team` and loopback port
8081. The copied `.env` still says 8080, so set the second team's non-secret
port there before starting it. Do not copy genuine credentials; create the
ignored local dummy file from the example. The two projects may build from
similar source, but they must not share a named database volume.

## The contract you must meet

The topology is `browser -> proxy -> non-root API -> Postgres`. Only the
proxy publishes `127.0.0.1:8081`; it shares a frontend network with the API,
and the API shares a backend network with Postgres. Supply the schema init
mount, the version-appropriate named volume mount, and meaningful startup
health conditions. You may keep the supplied `/api/` route or choose another
prefix, but explain the choice and keep UI requests consistent with Nginx
and API paths.

Use the primary [Postgres](https://hub.docker.com/_/postgres),
[Nginx](https://hub.docker.com/_/nginx) and
[Compose startup-order](https://docs.docker.com/compose/how-tos/startup-order/)
documentation to justify those settings before comparing with the guided
file. Keep dynamic API-name resolution in the proxy so recreation still works.
Redis is optional for this transfer task; if you include it, demonstrate its
disposability and edit freshness rather than adding a cache volume by habit.

Your acceptance evidence is:

1. Both entry points return working UI and API responses concurrently.
   Save different records in each and show that neither list contains the
   other's title.
2. Recreate the second database and API, then verify its unchanged records
   through Nginx. No backend host port may be added to make a check pass.
3. Recover a second-team logical backup into a third, unused empty project.
   You can stop the second team's proxy to reuse 8081 during this check;
   compare records through the recovered API, never over the first team's data.
4. Diagnose the incomplete incident from response body/status and selected
   logs, using the route, connection and dependency possibilities from
   chapter 6. State what you ruled out and what observation would change
   your mind.
5. Give your chosen audience a short runbook with start, readiness,
   development, recovery and project-scoped cleanup. Include one trade-off
   you chose, such as route stability versus a team-specific prefix.

If a peer is available, ask them to introduce one scoped fault in your copied
proxy configuration or stop one dependency, without telling you which. Work
from the report and preserve evidence before recovery. Working alone, choose
a fault from chapter 6, record only its symptom first, and write an incident
report explaining how you would distinguish it from the alternatives.

## Graduated hints

Try your own model first. Open one hint at a time, then return to a concrete
check rather than collecting all the hints before starting.

<details>
<summary>Hint 1: begin with ownership and the request path</summary>

Draw the two project boundaries. Which services share each network, which
service receives the secret, and which resource owns the durable records?
An image can be shared without sharing a project's volume.

</details>

<details>
<summary>Hint 2: let image documentation settle the mount</summary>

For Postgres major 17, find `PGDATA` and the warning about mounting at the
wrong parent path. Its init scripts run only for an empty directory, so a
misconfigured first start may need a reset of your disposable second-team
volume after you have identified the error.

</details>

<details>
<summary>Hint 3: choose a condition you can explain</summary>

Use a database TCP readiness probe rather than only observing its process.
Then let the API's database-aware readiness endpoint gate the proxy.
Check the double-dollar expansion in a Compose shell healthcheck.

</details>

<details>
<summary>Hint 4: compare with the guided model only after predicting</summary>

Compare your storage, network and startup choices with
`application/compose.yaml`. If a request fails, inspect whether the body
came from Nginx or the API before changing a port. Review the trailing slash
in the supplied proxy route if the API logs an unexpected path.

</details>

## Finish with a defensible cleanup

Before removing anything, list the project names you created and say which
volumes you intend to retain. Use `docker compose -p YOUR_PROJECT down` from
the matching directory; add `--volumes` only for that project's disposable
data after verifying any backup you want to keep. Never prune the engine or
reset `ark-reading` as a shortcut for repairing the second team.

Keep your runbook and explanation of the chosen route. A working second
project plus those decisions is stronger transfer evidence than another
copy of the guided command sequence.
