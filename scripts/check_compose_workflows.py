"""Isolated advanced Compose checks. Needs maintainer Python, Docker, and free 18080/18081."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
TRACK = ROOT / "advanced" / "compose-workflows"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-watch", action="store_true", help="explicitly leave Watch unverified")
    args = parser.parse_args()
    suffix = uuid.uuid4().hex[:10]
    work = TRACK / (".validation-" + suffix)
    shutil.copytree(TRACK / "application", work,
                    ignore=shutil.ignore_patterns("*.txt", "__pycache__", "backups"))
    # The requirements manifest is intentionally included despite the secret exclusion.
    shutil.copy2(TRACK / "application" / "api" / "requirements.txt", work / "api" / "requirements.txt")
    (work / "secrets" / "db-password.txt").write_text("ark-validation-dummy\n")
    (work / "backups").mkdir()
    projects = [f"arkcw-{suffix}-{tail}" for tail in ("a", "b", "failure")]
    watcher = None
    watch_log = None
    blocker = None
    base = "http://127.0.0.1:"

    def command(words, env=None, check=True):
        result = subprocess.run(words, cwd=work, env=env, capture_output=True,
                                text=True, encoding="utf-8", timeout=300)
        if check and result.returncode:
            raise RuntimeError(f"{' '.join(words)}\n{result.stdout}\n{result.stderr}")
        return result

    def compose(project, *words, cache=False, dev=False, failure=False, check=True):
        env = dict(os.environ, WEB_PORT="18081" if project == projects[1] else "18080",
                   DB_NAME="reading", DB_USER="reading")
        files = ["compose.yaml"]
        if cache:
            files.append("compose.cache.yaml")
        if dev:
            files.append("compose.dev.yaml")
        if failure:
            files.append("compose.failure.yaml")
        argv = ["docker", "compose", "-p", project]
        for file in files:
            argv += ["-f", file]
        return command(argv + list(words), env, check)

    def request(port, path="/books", method="GET", body=None):
        data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
        req = urllib.request.Request(base + str(port) + "/api" + path, data=data, method=method,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            raw = error.read().decode()
            return error.code, (json.loads(raw) if error.headers.get_content_type() == "application/json"
                                else {"raw": raw})

    def eventually(predicate, label, seconds=100):
        end = time.monotonic() + seconds
        while time.monotonic() < end:
            try:
                if predicate():
                    print("PASS", label, flush=True)
                    return
            except (OSError, ValueError, AssertionError):
                pass
            time.sleep(1)
        raise AssertionError("Timed out: " + label)

    def books(port):
        status, body = request(port)
        assert status == 200, body
        return body["books"]

    def cid(project, service):
        return compose(project, "ps", "-q", service, cache=service == "cache").stdout.strip()

    try:
        a, b, failure = projects
        compose(a, "build", "--quiet")
        compose(a, "build", "--quiet", "tests")
        unit = compose(a, "run", "--rm", "--no-deps", "tests")
        print(unit.stdout + unit.stderr, flush=True)
        print("PASS container unit tests", flush=True)
        # A delayed init on a new volume gives actual starting-vs-ready evidence.
        env = dict(os.environ, WEB_PORT="18080", DB_NAME="reading", DB_USER="reading")
        command(["docker", "compose", "-p", a, "-f", "compose.yaml", "-f", "compose.delay.yaml",
                 "up", "-d", "db"], env)
        assert not cid(a, "api")
        starting = json.loads(command(["docker", "inspect", cid(a, "db")]).stdout)[0]["State"]
        assert starting["Running"] and starting["Health"]["Status"] == "starting"
        command(["docker", "compose", "-p", a, "-f", "compose.yaml", "-f", "compose.delay.yaml",
                 "up", "-d", "--wait"], env)
        eventually(lambda: request(18080, "/ready")[0] == 200, "delayed startup and whole stack")
        html = urllib.request.urlopen(base + "18080/").read().decode()
        assert "Team reading list" in html
        inspect = json.loads(command(["docker", "inspect", cid(a, "api")]).stdout)[0]
        assert inspect["Config"]["User"] == "app"
        for service in ("api", "db"):
            value = json.loads(command(["docker", "inspect", cid(a, service)]).stdout)[0]
            assert not any(value["HostConfig"]["PortBindings"].values())
        proxy_inspect = json.loads(command(["docker", "inspect", cid(a, "proxy")]).stdout)[0]
        assert proxy_inspect["HostConfig"]["PortBindings"]["80/tcp"] == [
            {"HostIp": "127.0.0.1", "HostPort": "18080"}
        ]
        print("PASS non-root API, UI, loopback-only proxy and unpublished dependencies")
        (work / "requests" / "add-book.json").write_text(
            json.dumps({"title": "Docker café 📚"}, ensure_ascii=False), encoding="utf-8"
        )
        curl = "curl.exe" if os.name == "nt" else "curl"
        record = json.loads(command([curl, "--fail", "--silent", "--show-error",
                                     "-H", "Content-Type: application/json", "--data-binary",
                                     "@" + str(Path("requests") / "add-book.json"),
                                     base + "18080/api/books"]).stdout)
        print("PASS native curl file-body creation with UTF-8 data")
        book_id = record["book"]["id"]
        original = books(18080)
        assert request(18080, method="POST", body={"title": " "})[0] == 400
        compose(a, "up", "-d", "--force-recreate", "db", "api")
        eventually(lambda: books(18080) == original, "records survive database/API recreation")
        compose(a, "down")
        compose(a, "up", "-d", "--wait")
        assert books(18080) == original
        print("PASS records survive down/up")

        compose(a, "exec", "-T", "db", "pg_dump", "-U", "reading", "-d", "reading",
                "-Fc", "-f", "/var/lib/postgresql/reading.dump")
        backup = work / "backups" / "reading.dump"
        command(["docker", "cp", cid(a, "db") + ":/var/lib/postgresql/reading.dump", str(backup)])
        assert backup.stat().st_size > 0
        compose(b, "up", "-d", "--build", "--wait")
        assert books(18081) == []
        command(["docker", "cp", str(backup), cid(b, "db") + ":/var/lib/postgresql/reading.dump"])
        compose(b, "exec", "-T", "db", "pg_restore", "-U", "reading", "-d", "reading",
                "--clean", "--if-exists", "--no-owner", "--exit-on-error",
                "/var/lib/postgresql/reading.dump")
        assert books(18081) == original
        request(18081, method="POST", body={"title": "Only the second team"})
        assert books(18080) == original and len(books(18081)) == 2
        print("PASS byte-safe logical restore, API equivalence and independent projects")

        failed_start = compose(failure, "up", "-d", "--wait", failure=True, check=False)
        assert failed_start.returncode != 0
        state = json.loads(command(["docker", "inspect", cid(failure, "db")]).stdout)[0]
        assert state["State"]["Running"] and state["State"]["Health"]["Status"] == "unhealthy"
        assert not cid(failure, "api")
        print("PASS running-but-unhealthy database prevents dependent startup")

        compose(a, "stop", "db")
        started = time.monotonic()
        status, body = request(18080)
        assert status == 503 and "database unavailable" in body["error"]
        assert time.monotonic() - started < 12
        assert request(18080, "/ready")[0] == 503
        compose(a, "start", "db")
        eventually(lambda: books(18080) == original, "explicit bounded outage and reconnect")

        compose(a, "up", "-d", "--wait", cache=True)
        books(18080)
        books(18080)
        stats = request(18080, "/stats")[1]
        assert stats["hits"] >= 1 and stats["misses"] >= 1 and stats["db_reads"] >= 1
        assert request(18080, f"/books/{book_id}", "PUT", {"title": "A revised café 📚"})[0] == 200
        assert books(18080)[0]["title"] == "A revised café 📚"
        compose(a, "stop", "cache", cache=True)
        request(18080, f"/books/{book_id}", "PUT", {"title": "Changed while cache was away"})
        compose(a, "start", "cache", cache=True)
        assert books(18080)[0]["title"] == "Changed while cache was away"
        compose(a, "up", "-d", "--force-recreate", "cache", cache=True)
        assert books(18080)[0]["title"] == "Changed while cache was away"
        assert request(18080, "/stats")[1]["cache_errors"] >= 1
        print("PASS cache hits/misses, edit invalidation, outage-safe revision keys and disposable replacement")
        revision = compose(a, "exec", "-T", "db", "psql", "-U", "reading", "-d", "reading",
                           "-At", "-c", "SELECT revision FROM list_revision").stdout.strip()
        old_key = "books:" + revision
        assert "Changed while cache was away" in compose(
            a, "exec", "-T", "cache", "redis-cli", "GET", old_key, cache=True
        ).stdout
        cache_id = cid(a, "cache")
        command(["docker", "network", "disconnect", a + "_back", cache_id])
        try:
            assert request(18080, f"/books/{book_id}", "PUT",
                           {"title": "Partition-safe reading list"})[0] == 200
        finally:
            command(["docker", "network", "connect", "--alias", "cache", a + "_back", cache_id])
        # Redis kept its memory: an actual stale key survives failed invalidation.
        assert "Changed while cache was away" in compose(
            a, "exec", "-T", "cache", "redis-cli", "GET", old_key, cache=True
        ).stdout
        assert books(18080)[0]["title"] == "Partition-safe reading list"
        print("PASS network-partition invalidation failure with proven retained stale Redis key")

        before = json.loads(command(["docker", "inspect", cid(a, "api")]).stdout)[0]
        front = before["NetworkSettings"]["Networks"][a + "_front"]["IPAddress"]
        compose(a, "stop", "api", cache=True)
        status, response = request(18080)
        assert status in (502, 504) and "nginx" in response["raw"].lower(), (status, response)
        assert urllib.request.urlopen(base + "18080/").status == 200
        compose(a, "rm", "-f", "api", cache=True)
        blocker = command(["docker", "run", "-d", "--name", a + "-dns-check",
                           "--network", a + "_front", "--ip", front,
                           "python:3.13.7-slim", "sleep", "300"]).stdout.strip()
        compose(a, "up", "-d", "--no-deps", "api", cache=True)
        after = json.loads(command(["docker", "inspect", cid(a, "api")]).stdout)[0]
        assert after["NetworkSettings"]["Networks"][a + "_front"]["IPAddress"] != front
        eventually(lambda: books(18080)[0]["title"] == "Partition-safe reading list",
                   "proxy DNS refresh with proven changed API address")
        command(["docker", "rm", "-f", blocker])
        blocker = None
        proxy_config = work / "proxy" / "default.conf"
        original_config = proxy_config.read_text()
        proxy_config.write_text(original_config.replace(
            "proxy_pass http://reading_api/;", "proxy_pass http://reading_api;"
        ))
        compose(a, "up", "-d", "--build", "--wait", "proxy", cache=True)
        assert request(18080)[0] == 404
        assert request(18080)[1]["error"] == "route not found"
        proxy_config.write_text(original_config)
        compose(a, "up", "-d", "--build", "--wait", "proxy", cache=True)
        assert books(18080)[0]["title"] == "Partition-safe reading list"
        print("PASS static delivery during API outage, proxy gateway error, prefix fault/API 404 and repaired records")
        assert request(18080, "/missing")[0] == 404
        assert request(18080, f"/books/{book_id}", "DELETE")[0] == 200
        assert books(18080) == []
        print("PASS prefix routing, API 404, edit/delete CRUD")

        if not args.skip_watch:
            assert request(18080, method="POST", body={"title": "Keep me through Watch"})[0] == 201
            watch_records = books(18080)
            compose(a, "up", "-d", "--wait", cache=True, dev=True)
            watch_log = (work / "watch.log").open("w", encoding="utf-8")
            argv = ["docker", "compose", "-p", a, "-f", "compose.yaml", "-f", "compose.cache.yaml",
                    "-f", "compose.dev.yaml", "watch", "--no-up", "--prune=false"]
            watcher = subprocess.Popen(argv, cwd=work, env=env, stdout=watch_log, stderr=subprocess.STDOUT)
            eventually(lambda: "Watch enabled" in (work / "watch.log").read_text(encoding="utf-8"),
                       "Watch ready", seconds=45)
            source = work / "api" / "src" / "app.py"
            source.write_text(source.read_text().replace('GREETING = "Team reading list"',
                                                        'GREETING = "Watch updated the team list"'))
            eventually(lambda: request(18080, "/info")[1]["greeting"] == "Watch updated the team list",
                       "Watch sync+restart source update")
            assert books(18080) == watch_records
            old_id = cid(a, "api")
            requirements = work / "api" / "requirements.txt"
            requirements.write_text(requirements.read_text() + "\npackaging==25.0\n")
            eventually(lambda: cid(a, "api") != old_id and
                       request(18080, "/ready")[0] == 200, "Watch dependency rebuild", seconds=180)
            assert compose(a, "exec", "-T", "api", "python", "-c",
                           "import packaging; assert packaging.__version__ == '25.0'",
                           cache=True).returncode == 0
            assert request(18080, "/info")[1]["greeting"] == "Watch updated the team list"
            assert books(18080) == watch_records
            print("PASS installed changed dependency and proxy after Watch recreation")
        else:
            print("GAP Watch explicitly skipped")
        print("ALL SELECTED COMPOSE WORKFLOW CHECKS PASSED")
    except BaseException:
        for project in projects:
            result = compose(project, "logs", "--no-color", "--tail", "40", cache=True, check=False)
            print(result.stdout + result.stderr)
        if (work / "watch.log").exists():
            print((work / "watch.log").read_text(encoding="utf-8"))
        raise
    finally:
        if watcher:
            if os.name == "nt":
                # Docker launches Compose as a child plugin; killing only Docker
                # leaves Watch holding the log and watched files open on Windows.
                stop_tree = (
                    "function Stop-OwnedTree([int]$processId) { "
                    'Get-CimInstance Win32_Process -Filter "ParentProcessId = $processId" | '
                    "ForEach-Object { Stop-OwnedTree $_.ProcessId }; "
                    "Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }; "
                    f"Stop-OwnedTree {watcher.pid}"
                )
                subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", stop_tree],
                               capture_output=True, timeout=30)
            else:
                watcher.terminate()
            try:
                watcher.wait(timeout=15)
            except subprocess.TimeoutExpired:
                watcher.kill()
                watcher.wait()
        if watch_log:
            watch_log.close()
        if blocker:
            command(["docker", "rm", "-f", blocker], check=False)
        for project in projects:
            compose(project, "down", "--volumes", "--remove-orphans", cache=True, check=False)
            command(["docker", "image", "rm", project + "-api", project + "-proxy",
                     project + "-tests"], check=False)
        for attempt in range(10):
            try:
                shutil.rmtree(work)
                break
            except PermissionError:
                if attempt == 9:
                    raise
                time.sleep(1)


if __name__ == "__main__":
    main()
