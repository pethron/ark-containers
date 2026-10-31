# Image builds

The core build module ends with a single-stage recipe that installs a
pure-Python dependency and reuses that installation after an application
edit. When a dependency needs a compiler, or the build needs more control over
reuse and target platforms, these optional chapters take the next step.

We'll see how BuildKit plans stages and how a package cache helps a step that
has to run again, then which inputs a recipe fixes, which can move, and what
"the same build" can reasonably mean. The last chapter builds the service for
another CPU, and optionally compares a nerdctl build in a separate VM.

Each chapter starts from the template service of the core build module, so
finish that module's dependency chapter first. The commands use the same
Docker setup as the core course; the multi-platform chapter states the
additional builder support it needs, and its nerdctl comparison requires a
separate Linux VM. Build-time credentials are outside the scope of these
chapters.
