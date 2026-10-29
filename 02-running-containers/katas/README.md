# A service for the next shift

The demonstration has become a small internal service. Your colleague will
operate it tomorrow, and you won't be there to explain which commands are
safe. Prepare a handover that survives a configuration mistake.

Complete the module walkthrough first. Use Bash or PowerShell 7, Linux containers and the
course root. Reserve only `ark-shift-bad` and `ark-shift`; check that the names
and your chosen loopback port are free. Use the supplied
[operations wrapper](../service/README.md), a read-only course mount and a
loopback port. Use the paired launch commands as your reference.

## 1. Diagnose before replacing

Launch an instance called `ark-shift-bad` with
`SHUTDOWN_MODE=automatic`. You are not expected to repair the Python code.
Find it in `docker ps -a`, read its logs and explain why it stopped.

Write the next action before changing anything. Demonstrate that restarting
the same bad object doesn't replace its configuration, then remove only that
stopped fixture.

## 2. A new operating requirement

Your colleague needs a message identifying their shift, a host port other
than 8082, and a working stop/start procedure. Create
`ark-shift` with a valid configuration and satisfy those requirements.

Check `/` and `/health`, and write down which result would make you reject the
deployment. Then stop it, check the shutdown log, start it again and verify
the response. Include both Bash and PowerShell launch variants in the handover.

<details>
<summary>The setting changed, but the result didn't</summary>

Compare the environment stored in the container with your launch procedure.
A new shell variable and `docker restart` do not recreate the container.
Check the image/command boundary when placing `-e`.

</details>

<details>
<summary>It stopped, but was it clean?</summary>

Look for the supplied wrapper's shutdown-complete log. Merely disappearing
from the running list doesn't tell you what the application did before exiting.

</details>

## 3. Leave an explanation, not a command dump

Your handover should answer:

- Which command checks user-visible behavior rather than process existence?
- What survives restart, and what disappears on replacement?
- What evidence explains the bad configuration?
- Which restart policy fits this service, and what can't it repair?
- Which resources does the reset remove, and which remain?

The optional OOM, forced-stop and retry fixtures are not required here.
No host configuration or daemon restart is part of this kata.

Ask a colleague to follow the handover, or return in a fresh terminal the next
day and use only your notes. Stop and remove only the two named kata containers
that you created. The images and source files remain.
