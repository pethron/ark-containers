# Network service

This supplied pair is the application the module's
[Compose file](../compose.yaml) runs. The `web` frontend calls the `api`
backend at `/health` and returns the API's answer inside its own. Both
servers use only the Python standard library, and one image holds both
programs.

- [Dockerfile](Dockerfile) builds the image. Its default command starts the
  API; the frontend runs from the same image with `python /app/web.py`.
- [api.py](api.py) serves the backend on port 8000.
- [web.py](web.py) serves the frontend on port 8000. It reads the API's
  address from `BACKEND_URL`, which defaults to `http://ark-api:8000/health`.
- [test_services.py](test_services.py) checks a successful request and the
  distinct name-resolution, connection and backend HTTP failures.

You don't need to build it yourself: `docker compose up` in the parent
directory builds it for both services. The fixture has no database, external
account or persistent state.
