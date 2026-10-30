# Images and distribution

The [core image module](../../03-images-and-registries/README.md) follows an
image through a local handover, giving us a starting point for several
questions: how should we name successive releases, how do layers work,
and what happens when we retrieve an image from a registry? These optional
chapters follow those questions into the mechanisms and decisions behind
our exercise.

Choose a chapter based on what you'd like to understand next:

- [Versioning and tagging strategies](versioning-and-tagging-strategies.md):
  what a release number, date, build identifier or moving alias communicates.
- [Image content and writable layers](image-content-and-writable-layers.md):
  layer representations, image configuration and copy-up.
- [Digests, manifests and multi-arch images](digests-manifests-and-multi-arch-images.md):
  which object each digest identifies and how platforms are selected.
- [Registry contracts and authentication](registry-contracts-and-authentication.md):
  distribution, access control and storage lifecycle.
- [Platforms and execution compatibility](platforms-and-execution-compatibility.md):
  architecture, emulation, kernel features and policy.

Some inspection exercises contact registries, and the optional emulation
experiments assume your environment already supports it. Check the
prerequisites in the chapter you choose and return to the local save/load
exercise whenever you're ready. To try publication on your own computer,
use the separate
[local registry lab](../../03-images-and-registries/optional/run-a-local-registry.md).
