"""Introduce one deliberate, recoverable incident into a running Compose project.

Usage:
    python incident.py start --project NAME [--api SERVICE] [--fault FAULT]
    python incident.py reveal --project NAME
    python incident.py list

Only Docker commands are used, and only on the API container of the given
project. Nothing is deleted. The chosen fault is recorded in a sealed file so
you can compare it with your diagnosis afterwards.
"""

import argparse
import base64
import json
import random
import subprocess
import sys
from pathlib import Path

FAULTS = {
    "pause": "The API container was paused: it keeps its address but no process runs.",
    "disconnect": "The API container was disconnected from every network it was on.",
    "stop": "The API container was stopped with docker stop.",
    "read-only-data": "The directory holding the links file, and its content, were made read-only for every user.",
}


def docker(*args: str, check: bool = True) -> str:
    result = subprocess.run(["docker", *args], capture_output=True, text=True)
    if check and result.returncode != 0:
        sys.exit(f"docker {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def api_container(project: str, service: str) -> str:
    ids = docker("ps", "--quiet",
                 "--filter", f"label=com.docker.compose.project={project}",
                 "--filter", f"label=com.docker.compose.service={service}").split()
    if len(ids) != 1:
        sys.exit(f"Expected one running container for service '{service}' in project '{project}', "
                 f"found {len(ids)}. Start the stack and check --project and --api.")
    return ids[0]


def links_directory(container: str) -> str:
    env = json.loads(docker("inspect", "--format", "{{json .Config.Env}}", container))
    settings = dict(item.split("=", 1) for item in env if "=" in item)
    links_file = settings.get("LINKS_FILE", "/data/links.jsonl")
    return links_file.rsplit("/", 1)[0] or "/"


def apply(fault: str, container: str) -> None:
    if fault == "pause":
        docker("pause", container)
    elif fault == "disconnect":
        networks = json.loads(docker("inspect", "--format", "{{json .NetworkSettings.Networks}}", container))
        for network in networks:
            docker("network", "disconnect", network, container)
    elif fault == "stop":
        docker("stop", container)
    elif fault == "read-only-data":
        directory = links_directory(container)
        docker("exec", "--user", "0", container, "chmod", "-R", "a-w", directory)


def sealed_file(project: str) -> Path:
    return Path(f".incident-{project}.sealed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    start = commands.add_parser("start", help="introduce an incident")
    start.add_argument("--project", required=True, help="Compose project name")
    start.add_argument("--api", default="api", help="name of the API service in compose.yaml")
    start.add_argument("--fault", choices=sorted(FAULTS), help="choose instead of a random fault")
    reveal = commands.add_parser("reveal", help="show which incident was introduced")
    reveal.add_argument("--project", required=True)
    commands.add_parser("list", help="list the possible faults without revealing a choice")
    args = parser.parse_args()

    if args.command == "list":
        print("Possible faults: " + ", ".join(sorted(FAULTS)))
        return
    if args.command == "reveal":
        path = sealed_file(args.project)
        if not path.exists():
            sys.exit(f"No sealed incident for project '{args.project}' in this directory.")
        fault = base64.b64decode(path.read_text()).decode()
        print(f"{fault}: {FAULTS[fault]}")
        return

    fault = args.fault or random.choice(sorted(FAULTS))
    container = api_container(args.project, args.api)
    apply(fault, container)
    sealed_file(args.project).write_text(base64.b64encode(fault.encode()).decode())
    print(f"An incident has been introduced in project '{args.project}'. "
          "Diagnose it from what you can observe, then run: "
          f"python incident.py reveal --project {args.project}")


if __name__ == "__main__":
    main()
