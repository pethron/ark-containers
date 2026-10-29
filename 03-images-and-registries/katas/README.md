# An artifact for another environment

The next team has Docker, but doesn't trust a handover that says "use the
latest Python tag". They need to recover the artifact you tested, identify
its platform and launch the message service with it. Prepare evidence they
can verify, not just a successful screenshot from your laptop.

Use the chapter-01 handover archive and chapter-04 loopback registry workflow.
You need only the main Docker setup, Bash, curl and local disk. No external
registry account or advanced deep dive is required.

## 1. Recover a missing reference

Reserve a fresh local tag `ark-runtime:kata` after checking that it is unused.
Tag the identified runtime image, save that tag to a new archive of your own,
record its image ID and platform, then remove **only that extra tag**.

Recover it using the archive without resolving the original moving tag again.
Verify that the recovered local image ID and platform match your notes. Shared
cached layers may still exist: say honestly what this test did and didn't
establish.

Don't delete the original Python image, force-remove image IDs or prune the
host to simulate a missing tag. An isolated second engine is the right place
for an optional genuinely cold-cache test.

## 2. A registry reference the team can use

Follow the registry lab's resource checks and safe loopback binding. If its
container/volume already exist from your own unfinished attempt, inspect their
state before reusing them; never take over someone else's resources.

Publish the recovered image as `127.0.0.1:15000/ark/runtime:kata`. Record the
digest for that push and the object/platform it represents. Remove only the
extra registry tag locally, pull by the recorded digest, then launch the
service with that reference and a unique name `ark-artifact-service`.

Choose a free loopback host port, preserve read-only
source mounts, and set a new message. Verify `/`, `/health` and the running
container's `.Image` value against your handover notes.

## 3. A different architecture

The team now asks whether the archive also works on another CPU architecture.
Inspect the upstream index and identify the relevant platform descriptor.
Explain why the platform-specific archive you created isn't automatically the
right artifact, even if the registry uses the same human-readable tag.

No emulated execution is required. If you have an already-supported second
engine, repeat the appropriate platform selection there and record its actual
identity instead of predicting identical IDs across platforms.

<details>
<summary>I have three different SHA-256 values</summary>

Name the objects before comparing them. The local image ID is typically the
configuration digest; a pushed platform manifest has its own digest; an
upstream index can have another. Matching strings are meaningful only when
you know what each string identifies.

</details>

<details>
<summary>The image loads, but the service source is missing</summary>

That's a packaging boundary, not a corrupt archive. This is still the supplied
Python runtime image. The source and launch settings must accompany it until
module 04 puts the code in our own image.

</details>

## Check and reset

Your notes should let another reader distinguish content identity, platform
compatibility and application behavior. Include what would change for a real
authenticated TLS registry; the lab has not tested that production setup.

Stop and remove only `ark-artifact-service` and the registry container you
created. Remove the lab registry volume only when you intend to delete its
uploads. Remove only your extra tags and exact archive file, then its empty
directory. The original source, upstream image cache and unrelated resources
stay untouched.

Swap handovers with a colleague, or come back in a fresh terminal and follow
only your notes. What missing assumption would prevent the next person from
reproducing the service?
