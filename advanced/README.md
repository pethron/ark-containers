# Under the hood

The service worked, but now you're curious about how two processes can each
have a PID 1, or which component actually starts Python when you type
`docker run`. This is where we open up those mechanisms.

**These are optional advanced deep dives. You don't need them to complete the
core course or its final project.** The numbered modules already explain the
concepts needed to operate the application and justify your decisions; here
we go further into implementation and kernel behavior.

Each deep dive starts from something you've already observed. Two services
see different processes and ports while sharing one kernel, and the Linux
primitives explain how. A Docker request creates an object and then starts a
process, and the runtime architecture follows the components that do each
part. One image answers to several names and comes back intact from an
archive, which leads into images and distribution. A runtime that needs a
compiled package but not its compiler opens the questions of image builds,
and two services listening on the same port, one finding the other by name,
lead into container networking. Every one of them returns to the application
with an observation you can check.

You can open a deep dive whenever its question interests you, as long as
you've run the first application. The Linux primitives make useful background
for the runtime architecture, but you can also follow a linked explanation as
needed, and nothing here has to be finished before you continue the core
course.

Most exercises are Docker inspection labs that use Linux containers on the
same Desktop or native Engine setup as the core course. Inspecting host

For a fuller application task rather than a kernel experiment, the optional
[Compose application workflow](compose-workflows/README.md) uses the build,
storage, networking and Compose skills from modules 04–07. Its PostgreSQL,
Redis and Nginx stack starts from its own files; you can take that path
without completing these internals chapters first. Inspecting host
processes requires the actual Linux engine host, not an unrelated WSL
distribution. The manual sandbox and the direct containerd comparison go
further: they need a disposable Linux VM and additional privileges or tooling,
named before their commands. Don't modify Docker Desktop's internal VM or a
machine with someone else's managed workloads.

After investigating, return to your service and check one prediction against
its behavior. A deep dive has done its job when you can explain the work
you've already done more precisely than before.
