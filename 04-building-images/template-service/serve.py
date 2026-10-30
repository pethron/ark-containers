import os
import runpy

from jinja2 import Template


def main() -> None:
    os.environ.setdefault(
        "MESSAGE",
        Template("Hello {{ audience }}").render(
            audience=os.environ.get("AUDIENCE", "from ARK")
        ),
    )
    runpy.run_module("app", run_name="__main__")


if __name__ == "__main__":
    main()
