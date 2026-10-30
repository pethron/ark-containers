# Image builds

The [core build module](../../04-building-images/README.md) ends with a
single-stage recipe that installs a pure-Python dependency and reuses that
installation after an application edit. When a dependency needs a compiler,
or the build needs more control over reuse and target platforms, these
optional chapters take the next step.

Choose a chapter based on what you'd like to understand next:

- [BuildKit, stages and cache mounts](buildkit-stages-and-cache-mounts.md):
  how the builder plans stages, and how a package cache helps a step that
  has to run again.
- [Reproducible build inputs](reproducible-build-inputs.md): which inputs
  a recipe fixes, which can move, and what "the same build" can mean.
- [Multi-platform builds](multi-platform-builds.md): building the service
  for another CPU, and optionally comparing a nerdctl build in a separate VM.

Each chapter starts from the supplied
[template service](../../04-building-images/template-service/README.md),
so complete the core module's chapter 05 first. Build-time credential
handling belongs to the later [security module](../../08-security/README.md).
The commands use the same Docker setup as the core course; the multi-platform
chapter states the additional builder support it needs, and its nerdctl
comparison requires a separate Linux VM.
