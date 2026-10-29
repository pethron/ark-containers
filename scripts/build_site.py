# /// script
# requires-python = ">=3.11"
# dependencies = ["zensical==0.0.73"]
# ///
"""Build the public, noindex course preview from the existing chapter files."""

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / ".site-docs"
SITE = ROOT / "site"
NOINDEX = '<meta name="robots" content="noindex, nofollow">'


def main() -> None:
    if DOCS.exists():
        shutil.rmtree(DOCS)
    DOCS.mkdir()
    shutil.copyfile(ROOT / "web" / "index.md", DOCS / "index.md")
    for module in sorted(ROOT.glob("[0-9][0-9]-*")):
        if not module.is_dir():
            continue
        destination = DOCS / module.name
        if module.name in {
            "01-why-containers",
            "02-running-containers",
            "03-images-and-registries",
        }:
            shutil.copytree(
                module,
                destination,
                ignore=shutil.ignore_patterns("__pycache__", ".*"),
            )
        else:
            destination.mkdir()
            title = module.name[3:].replace("-", " ").capitalize()
            (destination / "README.md").write_text(
                f"# {title}\n\nThis module is in preparation.\n\n"
                "[Return to the first module](../01-why-containers/README.md).\n",
                encoding="utf-8",
            )

    shutil.copytree(
        ROOT / "advanced",
        DOCS / "advanced",
        ignore=shutil.ignore_patterns("__pycache__", ".*"),
    )

    subprocess.run(["zensical", "build", "--clean"], cwd=ROOT, check=True)
    pages = sorted(SITE.rglob("*.html"))
    if not pages:
        raise RuntimeError("The site build did not produce HTML pages.")
    for page in pages:
        html = page.read_text(encoding="utf-8")
        if "</head>" not in html:
            raise RuntimeError(f"Missing HTML head in {page.relative_to(SITE)}")
        html = html.replace("</head>", f"{NOINDEX}\n</head>", 1)
        page.write_text(html, encoding="utf-8")
    for page in pages:
        if NOINDEX not in page.read_text(encoding="utf-8"):
            raise RuntimeError(f"Missing noindex in {page.relative_to(SITE)}")
    print(f"Verified noindex on all {len(pages)} generated HTML pages.")


if __name__ == "__main__":
    main()
