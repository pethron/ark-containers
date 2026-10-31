# Images and distribution

The core image module follows an image through a local handover, and that
exercise raises more questions than it needs to answer. How should we name
successive releases of the same service? How do layers actually work, and what
happens when we retrieve an image from a registry? These optional chapters
follow those questions into the mechanisms and decisions behind our exercise.

Each chapter stands on its own question. Versioning and tagging look at what a
release number, a date, a build identifier or a moving alias communicates to
the people using your image. The chapter on image content follows layer
representations, image configuration and copy-up. Digests and manifests
explain which object each digest identifies and how a platform is selected,
registry contracts cover distribution, access control and storage lifecycle,
and the last chapter looks at architecture, emulation, kernel features and
policy when an image meets a machine.

Some inspection exercises contact public registries, and the optional
emulation experiments assume your environment already supports emulation, so
check the prerequisites at the top of the chapter you choose. If you'd like to
publish an application image yourself, the optional Docker Hub runbook follows
the build module and asks for an account and permission to upload.
