---
title: "Final project: a reading list you can hand over"
track: kata
---

# Final project: a reading list you can hand over

A small team keeps its shared reading list in a two-service application: an
API that saves links and a web page that shows them and lets people add new
ones. The developer who wrote it is moving to another project, and before
leaving she hands you the code with a short note: "It runs fine with Python
on my laptop. Can you make it run anywhere, keep the links safe and tell the
next person what to do when it breaks?"

That's the whole job, and you've done every part of it during the course on
smaller pieces. This time nobody supplies the Dockerfile, the commands or
the file that describes the stack. You decide how to package, run, connect
and preserve the application, you show the evidence that it works, and you
explain why you chose what you chose. Then someone breaks it on purpose, and
you find out what happened from what you can observe.

## What you receive

The [starter](starter/README.md) contains the two services, `api` and `web`,
written in Python with only the standard library, plus their tests. Its README
describes what each service expects: the settings it reads, the port it
listens on, where it keeps its data and what it prints when something goes
wrong. There are no Dockerfiles and no `compose.yaml`: writing them is part
of the project.

The starter also contains an [incident tool](starter/incident.py) that
introduces one deliberate, recoverable fault into your running stack once
your deployment works. It uses only Docker commands on your API container and
deletes nothing.

## Before you start

You need Docker running Linux containers with Compose, curl (`curl.exe` on
Windows) and Python 3.10 or later on your computer. Python is only needed to
run the starter's tests and the incident tool; the application itself must
run in containers.

Copy the `starter` directory somewhere outside the course checkout, for
example into a Git repository of your own, and work there. Choose a Compose
project name that is yours, publish the web page on `127.0.0.1:8080`, and
check `docker ps -a`, `docker volume ls` and `docker network ls` first so
that your names don't collide with leftovers from earlier exercises.

You can work alone or in a pair. The requirements and the rubric are the same
either way; in a pair, each of you writes and explains at least one of the
decisions and takes the lead on the incident diagnosis or the changed
requirement.

## The requirements

Your deployment is done when all of these are true and you can show the
evidence for each:

1. **Images you can identify.** Each service runs from an image built from a
   Dockerfile you wrote, without mounting the source code. You can say which
   image each container runs, by name and by ID, and nothing secret or
   unnecessary is copied into it.
2. **An answer from end to end.** A request to `http://127.0.0.1:8080/`
   lists the saved links, and adding a link through the page or with curl
   makes it appear in the list. You can explain what `/health` on the web
   service proves and what it doesn't.
3. **Links that survive.** The links survive `docker compose down` and `up`,
   a rebuild of both images and the replacement of the API container. You
   have made a backup and restored it into an empty volume, and checked that
   the restored list is complete.
4. **Only the door you need.** The API is reachable only from the web
   service, by name, and has no published port. The web page is published on
   loopback only.
5. **A stack someone else can run.** One `compose.yaml` describes the
   application, and a `RUNBOOK.md` tells the next person how to start it,
   check it, back up and restore the links, and clean up only what the
   project created.

When those five hold, take the two steps below. They are where most of the
learning happens, so leave enough time for them.

### Diagnose an incident

With the stack running, ask a peer to run the incident tool while you look
away, or run it yourself if you work alone:

```text
python incident.py start --project <your-project-name>
```

Run it from your copy of the starter. It picks one fault at random and keeps
the answer in a sealed file in that directory. Now find
out what's wrong from the outside, as you would with a real report: what does
the page show, what do `docker compose ps` and the logs say, and which
observation would tell two possible causes apart? Decide how to recover, do
it, and check that the links are still there. Only then compare your
diagnosis with the answer:

```text
python incident.py reveal --project <your-project-name>
```

Write down the symptom, the causes you considered, the observation that
settled it, the recovery you chose and why you preferred it to the others.
A wrong first guess that you ruled out with evidence is a good report; a
correct guess with no evidence is a weak one.

### Handle a changed requirement

A week later, a new request arrives. Pick one of the following, or ask a peer
or your instructor to pick it for you, and handle it without a recipe:

- **A second team.** Another team wants its own reading list on the same
  computer, at `127.0.0.1:8081`, with its own title and its own links. The
  two lists must not see each other's data.
- **A handover without a registry.** A colleague must run exactly your images
  on their machine, and you can only send files. Show how they can check that
  they are running the same image content you tested.
- **A new API version.** The team wants `/health` on the API to report
  `"version": "1.1"`. Release it without losing any link, and make sure you
  can go back to the previous version in one step if something goes wrong.
- **A new home for the links.** The links must move to a volume with a
  different name, decided by the team's naming convention, without losing any
  of them. Prove the count before and after.

## What to hand in

Hand in your working directory with the Dockerfiles, any ignore files,
`compose.yaml`, `RUNBOOK.md` and a `REPORT.md` based on the
[report template](starter/REPORT-template.md). The report collects your
decisions with the alternatives you considered, the evidence for each
requirement, the incident diagnosis, the changed requirement, and the risks
you have deliberately left open. Paste real command output, trimmed to the
lines that prove your point.

The [rubric](rubric.md) describes how the project is assessed. It looks at
the working result, the evidence and your reasoning, so read it before you
start rather than after.

## What this project leaves out

The course hasn't covered hardening, resource limits or health checks that
Docker acts on, so they aren't required here. That doesn't make them
irrelevant: the last section of your report asks which risks you can see in
your own deployment and what you would investigate next.

## Reset the project

`docker compose down` stops and removes your project's containers and network
and keeps the volume with the links. When you're completely done, `docker
compose down -v` also removes the project's named volumes, and the links with
them, so run it only once your backup is no longer needed. Then remove the
images you built with `docker image rm` and the names you gave them.
