---
title: "Check your understanding"
track: kata
---

# Check your understanding

Your frontend now reaches its API by name, and you've watched that connection
fail in two different ways. These questions ask you to reason about the same
stack from memory, so try to answer each one before opening its answer. Nobody
is keeping score: if your guess and the answer part ways, the link at the end
tells you which chapter to reread.

## 1. Two containers that can't find each other

Imagine you start `ark-api` and `ark-web` exactly as at the beginning of
chapter 01, with no `--network` option, and the frontend answers:

```json
{"service": "ark-web", "error": "name_resolution"}
```

Both containers are running. Why can't the frontend find the API, and why
wouldn't you fix it by writing the API's IP address into `BACKEND_URL`?

<details>
<summary>Answer</summary>

Without a `--network` option, Docker attaches both containers to its default
network. They could reach each other there by IP address, but that network
has no name server, so the name `ark-api` never becomes an address. Writing the
IP address into `BACKEND_URL` would work only until Docker replaces the API
container and gives it a different address, and then the configuration would
silently point at nothing. A network you create, such as `ark-net`, gives the
containers Docker's name server and lets the name stay stable while addresses
change. See [Connecting containers on a network](01-connect-two-services.md#let-the-frontend-call-the-api).

</details>

## 2. Read the frontend's complaint

After a colleague recreated the frontend, the page stopped working. Both
containers are on `ark-net`, and this is what the frontend returns and logs:

```json
{"service": "ark-web", "error": "connection"}
```

```text
Backend request failed: connection
```

Which link of the request broke, what would you compare first, and why
doesn't `docker port ark-api` help you here?

<details>
<summary>Answer</summary>

A `connection` error means the name resolved: the frontend found the API's
address on `ark-net`, then nothing answered on the port it tried. So the first
thing to compare is the port in the frontend's `BACKEND_URL` with the port the
API listens on, `8000`; a URL ending in `ark-api:8001/health` would produce
exactly this. `docker port` reports mappings to your computer, and the API has
none, because the frontend talks to the API's container port directly across
the network. If the port in the URL is right, check that the API is still
running. See [Troubleshooting container connections](03-diagnose-a-broken-connection.md#the-frontend-calls-the-wrong-port).

</details>

## 3. The API gets a new address

Suppose you remove `ark-api` and start a fresh one with the same name on
`ark-net`, and Docker happens to give it a different IP address. The
frontend keeps running throughout. Predict what your next request to
`http://127.0.0.1:8080/` returns, and explain why.

<details>
<summary>Answer</summary>

Once the new API is up, the page should show both services again, without
touching the frontend. The frontend asks Docker's name server about `ark-api`
on every request, and that name server always knows the current address of
each container on the network. The configuration only says `ark-api`, so a new
address changes the answer to the lookup and nothing else. You saw the same
behavior in chapter 01, when connecting both containers to `ark-net` fixed the
page without a restart. See [How containers find each other](02-how-the-request-finds-the-api.md#picture-the-trip).

</details>

## 4. Should the API get a door?

A teammate suggests starting the API with `-p 127.0.0.1:8081:8000`, "so the
frontend can reach it". What would you answer? Are there reasons you might
still decide to publish it?

<details>
<summary>Answer</summary>

The frontend doesn't need that port: it calls the API at `ark-api:8000` across
`ark-net`, and that conversation never passes through your computer's ports.
Publishing the API adds an entry point from outside Docker that the
application doesn't use, so the default choice is to leave it unpublished and
publish only the frontend. If you yourself needed to call the API from your
computer, for example while testing it on its own, publishing it on
`127.0.0.1` would be a choice you make for that reason, and one to undo
afterwards. See [Connecting containers on a network](01-connect-two-services.md#only-the-frontend-is-published).

</details>

## 5. A name that doesn't resolve

The frontend reports `name_resolution` again, `docker ps` shows both
containers running, and `BACKEND_URL` says `http://ark-api:8000/health`.
You run:

```text
docker network inspect --format '{{range .Containers}}{{.Name}} {{end}}' ark-net
```

and it prints only `ark-web`. What happened, and what would the output have
looked like if the problem were a misspelled name instead?

<details>
<summary>Answer</summary>

The API is running but has left `ark-net`, so the two containers share no
network you created and the frontend's lookup of `ark-api` finds nothing.
Reconnecting it with `docker network connect ark-net ark-api` brings the page
back. With a spelling mistake, the inspect would list both containers, and the
difference would show up when you compared the listed names with the host in
`BACKEND_URL`. Both causes produce the same error, which is why checking
membership and spelling separately is worth the extra command. See
[Troubleshooting container connections](03-diagnose-a-broken-connection.md#the-api-leaves-the-network).

</details>

## 6. An error that comes from the API

This time `curl -i` shows a `404` status, and the frontend's answer mentions
neither `name_resolution` nor `connection`. Which of the three questions from
chapter 02 already has a "yes" for an answer, and where would you look next?

<details>
<summary>Answer</summary>

The name resolved and something was listening on the port, because the API
itself sent the `404` and the frontend passed that status back to you. That
puts the problem in the third question, whether the application answers the
request, so the network is fine. The usual suspect is the path in
`BACKEND_URL`, since the API only answers on `/health`, and the API's logs show
which path it received. See [Troubleshooting container connections](03-diagnose-a-broken-connection.md#read-the-symptom-first).

</details>

## 7. Looking back: two ports called 8000

In the first module you ran two copies of the message service. Both listened
on port `8000` inside their containers, yet each needed its own port on your
computer. With the picture from this module, how would you explain that now?

<details>
<summary>Answer</summary>

Each container has its own network card, address and set of ports, so two
programs listening on port `8000` in two containers never get in each other's
way. Your computer has only one port `8080`, though, and a published port is a
door from your computer into one specific container. Two copies therefore need
two doors, such as `8080` and `8081`, even though both lead to a port `8000`
on the other side. See [How containers find each other](02-how-the-request-finds-the-api.md#picture-the-trip).

</details>

When the symptoms in these questions feel familiar, the
[kata](katas/README.md) hands you a broken stack and leaves the diagnosis to
you.
