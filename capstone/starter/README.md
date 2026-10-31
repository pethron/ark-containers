# Reading list starter

These two services are the code the developer handed over. Both use only the
Python standard library, so a plain Python base image is enough to run them.
What follows is their contract: what each one reads, listens on, writes and
prints. How you package and run them is up to you.

## `api`: saves and lists links

| Setting | Default | Meaning |
|---------|---------|---------|
| `PORT` | `8000` | Port the API listens on inside its container |
| `LINKS_FILE` | `/data/links.jsonl` | File where links are saved, one JSON object per line |

- `GET /health` answers `{"service": "reading-api", "status": "ok"}`.
- `GET /links` answers `{"links": [{"url": ..., "title": ...}, ...]}`.
- `POST /links` with a JSON body such as
  `{"url": "https://example.org", "title": "Example"}` saves a link and
  answers `201`. The URL must start with `http://` or `https://`.

At startup the API checks that it can write the links file, or the directory
that will contain it, and exits with `Cannot write links file ...: Permission
denied` if it can't. When a save fails later, it answers `500` and logs
`Cannot save link to ...` with the reason.

## `web`: the page people use

| Setting | Default | Meaning |
|---------|---------|---------|
| `API_URL` | none, required | Base address of the API, for example `http://<name>:<port>` |
| `SITE_TITLE` | `Reading list` | Title shown on the page |
| `PORT` | `8000` | Port the web service listens on inside its container |

- `GET /` asks the API for the links and shows them as an HTML page with a
  form to add one.
- `POST /add` accepts the form fields `url` and `title`, forwards them to the
  API and redirects to `/`. With curl:
  `curl -d "url=https://example.org&title=Example" http://127.0.0.1:8080/add`.
- `GET /health` answers `{"service": "reading-web", "status": "ok"}`. It
  reports only the web process and doesn't contact the API.

Without `API_URL`, the web service exits at startup with a message saying so.
When it can't reach the API, the page says that the reading list is
unavailable and the log shows `API request failed:` followed by
`name_resolution`, `connection` or `timeout`; the status is `502`, or `504`
for a timeout.

## Tests

The tests start both services in one Python process and check the contract
above, including the three failure kinds. From this directory:

```text
python -m unittest discover -s tests
```

They prove that the code behaves as described; they don't prove anything
about your images, networks or volumes. That evidence comes from the running
stack.

## Incident tool

`incident.py` introduces one recoverable fault into a running Compose project
for the incident step of the project. `python incident.py list` shows the
possible faults without choosing one; the [project brief](../README.md)
explains how to use it.
