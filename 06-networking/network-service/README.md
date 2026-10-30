# Networking services

This supplied pair gives the module a request that has to cross a Docker
network. `ark-web` calls `ark-api` at `/health` and returns the API's answer
inside its own. Both servers use only the Python standard library, and one
image holds both programs.

- [Dockerfile](Dockerfile) builds the image. Its default command starts the
  API; the frontend runs from the same image with `python /app/web.py`.
- [api.py](api.py) serves the backend on port 8000.
- [web.py](web.py) serves the frontend on port 8000. It reads the API's
  address from `BACKEND_URL`, which defaults to `http://ark-api:8000/health`.
- [test_services.py](test_services.py) checks a successful request and the
  distinct name-resolution, connection and backend HTTP failures.

Build the image from this directory:

```text
docker build -t ark-network:v1 .
```

The fixture has no database, external account or persistent state, so the
module can stay focused on how one service finds another.
