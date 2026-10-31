"""Check the course labs: fixture unit tests and container smoke tests.

Usage:
    python scripts/check_labs.py            # unit tests and Docker checks
    python scripts/check_labs.py --no-docker

Every Docker object gets a unique ``arklab-<id>`` prefix and is removed at the
end, so the checks don't touch containers, images or volumes you already have.
Published ports are chosen by Docker on 127.0.0.1, so 8080 can stay in use.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREFIX = f"arklab-{uuid.uuid4().hex[:8]}"

UNIT_TEST_DIRS = [
    ("04-building-images/message-service", "."),
    ("04-building-images/template-service", None),
    ("05-storage/notes-service", "."),
    ("06-networking/network-service", "."),
    ("07-compose/stack/network-service", "."),
    ("07-compose/stack/notes-service", "."),
    ("capstone/starter", "tests"),
]


class CheckFailed(Exception):
    pass


class Docker:
    """Runs Docker commands and remembers what to clean up."""

    def __init__(self) -> None:
        self.containers: list[str] = []
        self.images: list[str] = []
        self.volumes: list[str] = []
        self.networks: list[str] = []
        self.projects: list[tuple[Path, str, list[str]]] = []

    def run(self, *args: str, cwd: Path | None = None, check: bool = True) -> str:
        result = subprocess.run(
            ["docker", *args], cwd=cwd, capture_output=True, text=True, encoding="utf-8"
        )
        if check and result.returncode != 0:
            raise CheckFailed(f"docker {' '.join(args)} failed:\n{result.stderr.strip()}")
        return result.stdout.strip()

    def name(self, kind: str) -> str:
        return f"{PREFIX}-{kind}"

    def build(self, context: Path, dockerfile: str = "Dockerfile") -> str:
        tag = f"{PREFIX}-{context.name}-{dockerfile.lower().replace('.', '-')}:test"
        self.images.append(tag)
        self.run("build", "-q", "-f", str(context / dockerfile), "-t", tag, str(context))
        return tag

    def container(self, kind: str, *args: str) -> str:
        name = self.name(kind)
        self.containers.append(name)
        self.run("run", "-d", "--name", name, *args)
        return name

    def published(self, container: str, port: str = "8000/tcp") -> str:
        address = self.run("port", container, port).splitlines()[0]
        return f"http://127.0.0.1:{address.rsplit(':', 1)[1]}"

    def cleanup(self) -> None:
        for directory, project, files in reversed(self.projects):
            self.run("compose", *files, "-p", project, "down", "-v", "--rmi", "local",
                     cwd=directory, check=False)
        if self.containers:
            self.run("rm", "-f", *self.containers, check=False)
        for network in self.networks:
            self.run("network", "rm", network, check=False)
        if self.volumes:
            self.run("volume", "rm", *self.volumes, check=False)
        if self.images:
            self.run("image", "rm", *self.images, check=False)


def request(url: str, data: bytes | None = None, timeout: float = 20) -> tuple[int, dict]:
    """Send a request, retrying while the service is still starting."""
    deadline = time.monotonic() + timeout
    while True:
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=5) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)
        except (urllib.error.URLError, ConnectionError, json.JSONDecodeError):
            if time.monotonic() > deadline:
                raise CheckFailed(f"no answer from {url}") from None
            time.sleep(0.5)


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise CheckFailed(message)


def check_message_service(docker: Docker) -> None:
    context = ROOT / "04-building-images" / "message-service"
    # This recipe is published as ghcr.io/pethron/ark-message, used from module 01.
    image = docker.build(context)
    container = docker.container(
        "04-message", "-e", "MESSAGE=lab check", "-p", "127.0.0.1::8000", image
    )
    url = docker.published(container)
    status, body = request(url + "/")
    expect(status == 200 and body.get("message") == "lab check", f"unexpected answer: {body}")
    status, body = request(url + "/health")
    expect(status == 200 and body.get("status") == "ok", f"unexpected health: {body}")
    user = docker.run("exec", container, "id", "-un")
    expect(user == "ark", f"service runs as {user!r}, expected 'ark'")

    exec_image = docker.build(context, "Dockerfile.exec")
    container = docker.container("04-exec", exec_image)
    time.sleep(1)
    started = time.monotonic()
    docker.run("stop", container)
    expect(time.monotonic() - started < 8, "the exec-form service ignored the stop signal")
    docker.build(context, "Dockerfile.shell")


def check_template_service(docker: Docker) -> None:
    context = ROOT / "04-building-images" / "template-service"
    image = docker.build(context)
    # Its dependencies exist only in the image, so its unit test runs there.
    docker.run(
        "run", "--rm", "--mount", f"type=bind,source={context},target=/src,readonly",
        "-w", "/src", "-e", "PYTHONDONTWRITEBYTECODE=1",
        image, "python", "-m", "unittest", "-q", "test_serve",
    )
    container = docker.container("04-template", "-p", "127.0.0.1::8000", image)
    status, _ = request(docker.published(container) + "/health")
    expect(status == 200, f"template service health returned {status}")


def check_notes_service(docker: Docker) -> None:
    image = docker.build(ROOT / "05-storage" / "notes-service")
    volume = docker.name("notes")
    docker.volumes.append(volume)
    docker.run("volume", "create", volume)
    mount = f"type=volume,source={volume},target=/data"

    first = docker.container("05-notes-a", "--mount", mount, "-p", "127.0.0.1::8000", image)
    status, body = request(docker.published(first) + "/notes", data=b"Water the plants")
    expect(status == 201, f"saving a note returned {status}: {body}")
    docker.run("rm", "-f", first)

    second = docker.container("05-notes-b", "--mount", mount, "-p", "127.0.0.1::8000", image)
    status, body = request(docker.published(second) + "/notes")
    expect("Water the plants" in body.get("notes", []), f"note lost after replacement: {body}")


def check_network_service(docker: Docker) -> None:
    image = docker.build(ROOT / "06-networking" / "network-service")
    network = docker.name("net")
    docker.networks.append(network)
    docker.run("network", "create", network)
    api = docker.container("06-api", "--network", network, image)
    web = docker.container(
        "06-web", "--network", network, "-p", "127.0.0.1::8000",
        "-e", f"BACKEND_URL=http://{api}:8000/health",
        image, "python", "/app/web.py",
    )
    status, body = request(docker.published(web) + "/")
    expect(status == 200 and "backend" in body, f"frontend couldn't reach the API: {body}")
    expect(docker.run("port", api) == "", "the API should not publish any port")


def check_compose_stack(docker: Docker, workdir: Path) -> None:
    directory = ROOT / "07-compose" / "stack"
    override = workdir / "compose.ports.yaml"
    override.write_text(
        'services:\n  web:\n    ports: !override\n      - "127.0.0.1::8000"\n',
        encoding="utf-8",
    )
    project = docker.name("compose")
    files = ["-f", "compose.yaml", "-f", str(override)]
    docker.projects.append((directory, project, files))
    docker.run("compose", *files, "-p", project, "up", "-d", "--build", "--quiet-pull",
               cwd=directory)
    address = docker.run("compose", *files, "-p", project, "port", "web", "8000", cwd=directory)
    status, body = request(f"http://127.0.0.1:{address.rsplit(':', 1)[1]}/")
    expect(status == 200 and "backend" in body, f"the stack's frontend failed: {body}")


def run_unit_tests() -> list[str]:
    failures = []
    for directory, start in UNIT_TEST_DIRS:
        if start is None:
            print(f"--   unit tests {directory} (run inside its image by the Docker checks)")
            continue
        result = subprocess.run(
            [sys.executable, "-m", "unittest", "discover", "-s", start, "-p", "test_*.py"],
            cwd=ROOT / directory, capture_output=True, text=True,
        )
        summary = result.stderr.strip().splitlines()[-1] if result.stderr.strip() else ""
        print(f"{'ok  ' if result.returncode == 0 else 'FAIL'} unit tests {directory} ({summary})")
        if result.returncode != 0:
            failures.append(f"unit tests in {directory}:\n{result.stderr}")
    return failures


def run_docker_checks() -> list[str]:
    docker = Docker()
    failures = []
    checks = [
        ("01-04 message service", lambda: check_message_service(docker)),
        ("04 template service", lambda: check_template_service(docker)),
        ("05 notes in a volume", lambda: check_notes_service(docker)),
        ("06 two services on a network", lambda: check_network_service(docker)),
    ]
    with tempfile.TemporaryDirectory() as workdir:
        checks.append(("07 Compose stack", lambda: check_compose_stack(docker, Path(workdir))))
        try:
            for label, check in checks:
                try:
                    check()
                except CheckFailed as error:
                    print(f"FAIL {label}")
                    failures.append(f"{label}: {error}")
                else:
                    print(f"ok   {label}")
        finally:
            docker.cleanup()
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--no-docker", action="store_true", help="run only the unit tests")
    options = parser.parse_args()

    failures = run_unit_tests()
    if not options.no_docker:
        failures += run_docker_checks()

    if failures:
        print("\n" + "\n\n".join(failures), file=sys.stderr)
        return 1
    print("\nAll lab checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
