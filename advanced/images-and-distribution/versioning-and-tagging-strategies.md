---
title: "Versioning and tagging strategies"
track: architecture
---

# Versioning and tagging strategies

Your colleague has the service running, and a few days later you send them
an update. Before replacing anything, they ask a reasonable question:
"What changed, and will my existing setup still work?" The `handover` tag
was enough to describe our exercise, but now we need a way to talk about
successive releases of the same software.

That's where **versioning** becomes useful. By giving releases recognizable
identifiers and explaining how they change, a project helps users choose
an update and understand what to expect from it. Image tags can carry those
identifiers, so the convention you choose becomes part of how people use
your software.

You'll encounter several conventions across Docker repositories because
Docker standardizes the syntax of an image reference and leaves release
policy to each project. Let's follow our status service through a few
updates to see what the common choices communicate, starting with the
version numbers you've probably seen on other software.

## Versions describe a release

Suppose other applications have started calling our status service.
Their developers rely on its documented endpoints and responses, which
gives us a compatibility contract to maintain: they need to know whether
upgrading the service will require changes on their side.

**Semantic Versioning**, usually shortened to SemVer, expresses changes
to that contract through three numbers: `MAJOR.MINOR.PATCH`. Once the
public API is stable, a patch release fixes bugs while preserving
compatibility, a minor release adds compatible functionality, and a major
release introduces incompatible changes.

Imagine the service is at `1.4.2` and you fix a formatting bug while
preserving the documented API. That could become `1.4.3`, giving your
colleague a bug fix within the same compatibility contract. If you then
add an optional endpoint, `1.5.0` communicates the addition; removing an
endpoint their application uses would require a major release such as
`2.0.0`, along with instructions for adapting the client.

For these numbers to be useful, the project needs to say that it follows
SemVer and define the public API covered by that promise. Check those
details when choosing a dependency, especially while a project is still
in its initial `0.x` development phase, where SemVer allows the public
API to change more freely.

Some projects organize their releases around time, making **Calendar
Versioning**, or CalVer, a useful alternative. Ubuntu's `24.04`, for
example, identifies its April 2024 release. That convention helps users
place the release in a schedule and find its support window, while the
release documentation explains compatibility and upgrade requirements.
For a project with a regular release calendar, the date may be the most
useful information to put in the version.

## Tags can be fixed releases or moving aliases

Let's bring those versions back to image references. A team releasing
`1.4.2` might publish `my-app:1.4.2` and give the same image the additional
tags `my-app:1.4` and `my-app:1`. Someone choosing the full release tag
can ask for that release, while someone choosing a shorter alias can
follow updates within the documented series.

When `1.4.3` arrives, the team's publication process can move `1.4` and
`1` to the new image and preserve `1.4.2` for people who still need it.
Each of those tag assignments is a choice made by the publisher, so
check the policy before relying on how an alias will move.

Names such as `stable` and `latest` work in the same way: the publisher
assigns them to content according to its own release process. Docker
uses `latest` when you omit the tag from a reference, without comparing
release numbers or dates. If you use an alias for convenience, expect
that resolving it again may give you a newer image and plan your tests
accordingly.

There's one more decision for the team to make. Suppose the application
remains at `1.4.2`, while an updated base image provides a security fix
for one of its supporting libraries. Rebuilding the application produces
different image content for the same application release, so the team
needs a policy for identifying that rebuild: it might publish a separate
image revision or update the existing release tag.

Document that behavior and use registry immutability controls if your
policy requires tags to stay fixed. For a deployment that needs the exact
published content you tested, record its digest as well; that gives you
a content-based reference even when the release policy allows tags to move.

## Build identity answers another question

Now imagine that your colleague reports a problem with one of those
images. Alongside the release version, you'd want to know which source
revision and build produced it, especially if several builds were made
while preparing the release. A tag such as `git-a1b2c3d` can connect an
image to a source commit, and a build number from your automated pipeline
can distinguish separate build attempts.

These identifiers help you investigate where an image came from.
Reproducing its exact content also depends on the base image,
dependencies and other build inputs, which can change between attempts
even when the source commit stays the same. That's why a release version,
a build identifier and a digest can all be useful for the same image:
they help users choose a release, help maintainers trace its creation
and let a deployment select particular content.

Choosing suitable software still requires reading its documentation and
checking its provenance and platform support. For example, the
`alpine` suffix in our familiar `python:3.12-alpine` reference describes
an Alpine-based variant alongside the Python release series. The
publisher's tag documentation explains what that combination includes
and which updates it follows, just as a release policy explains how
version aliases move.

## Choose a convention with an audience

For a first project with a documented API, I'd start with SemVer and a
short release policy explaining the compatibility promise. If the project
is organized around scheduled releases, a calendar convention may give
users a clearer way to choose. Add build identifiers when they help your
team trace frequent builds, and explain which image tags move, which stay
fixed and where users can find the digest of a tested release.

You'll also encounter tags outside image repositories. Git tags name
source revisions, while Docker labels and cloud resource tags attach
metadata to resources. A release pipeline can use these together, for
example by building a source revision named by a Git tag and publishing
an image with a corresponding release tag, but the pipeline must perform
each step.

For our local handover, `handover` still communicates everything we need
from the tag: it names the image we're preparing for the exercise. When
you return to [the core tagging chapter](../../03-images-and-registries/02-one-image-several-names.md),
keep the same habit for future projects: decide what the person choosing
your image needs to know, then make the tags and release documentation
support that decision.

## References

- [Docker image reference syntax](https://docs.docker.com/reference/cli/docker/image/tag/)
- [Docker Hub tags](https://docs.docker.com/docker-hub/repos/manage/hub-images/tags/)
- [Semantic Versioning specification](https://semver.org/)
- [Calendar Versioning](https://calver.org/)
- [Ubuntu release cycle](https://ubuntu.com/about/release-cycle)
