# Under the hood

The service worked, but now you're curious about how two processes can each
have a PID 1, or which component actually starts Python when you type
`docker run`. This is where we open up those mechanisms.

**These are optional advanced deep dives. You don't need them to complete the
core course.** The numbered modules already explain the
concepts needed to operate the application and justify your decisions; here
we go further into implementation and kernel behavior.

Each deep dive starts from something you've already observed. Namespaces give
two services different views while they share a kernel; image references and
layers make a handover possible; a builder can prepare a package without
shipping its compiler. The networking exercises show how services find each
other and how a published port reaches one of them.

The navigation places selected explanations in an **Under the hood
(optional)** group in the module that raises the question. Open one when you
want more detail, then return to the service you were working on. None is a
prerequisite for continuing the numbered chapters.

Most inspection exercises work with Linux containers on the same Desktop or
native Engine setup as the core course. A host-side inspection needs the
actual Linux engine host, not an unrelated WSL distribution. Don't modify
Docker Desktop's internal VM or a machine with someone else's workloads.

For a fuller application task rather than a kernel experiment, module 07's
[reading-list application](compose-workflows/README.md) uses the build,
storage, networking and Compose skills from the core modules. Its PostgreSQL,
Redis and Nginx stack starts from its own files; you can take that path
without completing these internals chapters first.

After investigating, return to your service and check one prediction against
its behavior. A deep dive has done its job when you can explain the work
you've already done more precisely than before.
