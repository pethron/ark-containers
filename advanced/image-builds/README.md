# Image builds

The core build module reuses a dependency installation after an application
edit, then follows a two-stage build that leaves the compiler out of the
running image. These optional chapters compare those build choices more
closely and ask what it takes to reproduce the result later.

We'll see how BuildKit plans stages and how a package cache helps a step that
has to run again, then which inputs a recipe fixes, which can move, and what
"the same build" can reasonably mean.

Each chapter starts from the template service of the core build module, so
finish that module's dependency chapter first. The commands use the same
Docker setup as the core course. Build-time credentials are outside the scope
of these chapters.
