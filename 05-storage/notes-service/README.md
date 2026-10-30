# Notes service

This is the example for [module 05](../README.md): a small web service that
answers with a message and a health check, and saves notes to a file, so
storage has something to keep.
Use the chapters for the walkthrough, or the commands below to build and run
it with a volume.

From this directory, build the image and start the service. On Linux Engine,
prefix Docker commands with `sudo` if your setup requires it. The build needs
a network connection to look up the Python base image.

```text
docker build -t ark-notes:v1 .
docker run -d --name ark-notes -p 127.0.0.1:8080:8000 --mount type=volume,source=ark-notes-data,target=/data ark-notes:v1
```

=== "Linux (Bash)"

    ```bash
    curl -d "Water the plants" http://127.0.0.1:8080/notes
    curl http://127.0.0.1:8080/notes
    curl http://127.0.0.1:8080/health
    ```

=== "Windows (PowerShell)"

    ```powershell
    curl.exe -d "Water the plants" http://127.0.0.1:8080/notes
    curl.exe http://127.0.0.1:8080/notes
    curl.exe http://127.0.0.1:8080/health
    ```

If a request arrives before startup finishes, wait a moment and repeat it.
Stop and remove the container with `docker stop ark-notes` and
`docker rm ark-notes`; the notes stay in the `ark-notes-data` volume until you
remove it with `docker volume rm ark-notes-data`.

## What is supplied

- [app.py](app.py): the service, using only the Python standard library.
  `GET /` answers with a message, which `MESSAGE` can change, and the
  container's hostname; `GET /health` reports `ok`. `POST /notes` saves the
  request body as a note and `GET /notes` lists them. Notes go to
  `/data/notes.txt`, one per line, or
  to the file named by `NOTES_FILE`. At startup the service checks that it
  can write there and exits with an error in its log if it can't.
- [Dockerfile](Dockerfile): builds on `python:3.12-alpine` and runs the
  service as the unprivileged `ark` user, with a `/data` directory owned by
  `ark`. The code stays root-owned and read-only for `ark`.
- [Dockerfile.srv](Dockerfile.srv): the same recipe preparing `/srv/notes`
  instead, for the [permission experiment](../03-choose-a-volume-bind-mount-or-tmpfs.md#a-volume-at-a-new-path).
- [test_app.py](test_app.py): unit tests for the HTTP and notes behavior,
  excluded from the build context.

## What this example leaves out

A note is at most 1,000 bytes, and line breaks inside it become spaces.
There's no editing, deletion, authentication or TLS: the port is bound to
loopback for local learning. The plain-text file is safe to back up while the
service is stopped, as the backup chapter does; it isn't a database, and a
service with real concurrent writers would need one along with its own backup
procedure.
