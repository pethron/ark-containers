# Under the hood

The service worked, but now you're curious about how two processes can each
have a PID 1, or which component actually starts Python when you type
`docker run`. This is where we open up those mechanisms.

**These are optional advanced deep dives. You don't need them to complete the
core course or its final project.** The numbered modules already explain the
concepts needed to operate the application and justify your decisions; here
we go further into implementation and kernel behavior.

## Choose a question

| Deep dive | Start from an observation | Return to the application |
|-----------|---------------------------|---------------------------|
| [Linux primitives](linux-primitives/README.md) | Two services have different process and port views but share a kernel | Inspect their actual boundaries, budgets and permissions |
| [Runtime architecture](runtime-architecture/README.md) | A Docker request creates an object, then starts a process | Distinguish client, runtime-start and application failures |

Start with the [first application](../01-why-containers/03-your-first-application.md)
before either deep dive. The Linux primitives chapters provide useful background
for runtime architecture; you can also follow a linked explanation as needed.
There's no requirement to finish both before returning to the core course.

## Follow a question from the core

- After [resource failure diagnosis](../02-running-containers/06-resource-usage-and-failure.md),
  read [cgroups v2](linux-primitives/03-cgroups-v2.md) for enforcement details,
  then compare a chosen budget with the service's actual settings.
- After [image identity](../03-images-and-registries/03-digests-manifests-and-multi-arch-images.md),
  read [OCI image contracts](runtime-architecture/04-oci-image-and-distribution-specs.md)
  for the content graph, then identify the objects in your handover.
- After [observing the service](../02-running-containers/01-observe-a-running-service.md),
  follow [the Engine request path](runtime-architecture/01-the-docker-engine.md)
  if you want to understand which component owns each step.

These are invitations to investigate, not extra assignments needed to pass the
core exercises.

## Choose the environment, too

The Docker inspection labs use Linux containers on the same Desktop or native
Engine setup as the first application. Host-process inspection requires the
actual Linux engine host, not an unrelated WSL distribution.

The manual sandbox and direct-containerd comparison are further optional
experiments. They require a disposable Linux VM and additional privileges or
tooling, named before their commands. Don't modify Docker Desktop's internal
VM or a machine with someone else's managed workloads.

After investigating, return to your service and check one prediction against
its behavior. The aim isn't a second pile of definitions: it's a more precise
explanation of the work you've already done.

[Start the core course](../01-why-containers/README.md).
