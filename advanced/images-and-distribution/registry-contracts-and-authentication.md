---
title: "Registry contracts and authentication"
track: architecture
---

# Registry contracts and authentication

An archive hands your colleague a file. Publishing the same application to
Docker Hub adds a shared destination, an account and repository permissions.
The artifact still needs the platform and launch checks from our handover,
but now a client also has to retrieve it through a service.

Let's follow that content-transfer contract and separate it from the
operational choices around the registry.

## Resolve a name, fetch referenced content

A pull generally resolves the requested tag or digest, reads a manifest or
index, selects platform content where needed, and retrieves the referenced
configuration and layer blobs. The client verifies content against descriptors
and prepares local filesystem state through its image store.

A registry moves those objects. It doesn't start Python, create a PID
namespace, configure the application's message or prove that a port responds.
That boundary is why a successful pull and an OCI runtime startup error can
appear in the same deployment.

The distribution protocol lets clients discover existing blobs so they don't
need to upload every shared layer again. A push saying that a layer already
exists is usually an optimization, not evidence that your code was ignored.
Repository authorization still governs which operations are allowed.

## Authentication isn't the same as authorization

Authentication establishes who the client is. Authorization decides whether
that identity may pull or push a particular repository. A registry can use
an authentication challenge and a token service, with scopes governing the
requested action.

For a real registry, use TLS and its supported login procedure, preferably
with a credential helper or appropriate short-lived credentials. Don't put a
password in a command-line argument, Dockerfile, image tag or committed file.
Docker can accept a password/token through standard input; arrange the input
using your platform's secret handling, not a literal pasted into shell history.

Client configuration matters too: `docker login` operates in that user's
Docker configuration. Mixing a non-root login with unrelated `sudo docker`
configuration can produce confusing differences. Diagnose which client
configuration and credential helper are in use before concluding the registry
lost your account.

## Read the stage of the failure

| Observation | Questions worth asking |
|-------------|------------------------|
| Cannot resolve or connect | Which host makes the request? DNS, route, proxy or endpoint? |
| TLS verification error | Correct hostname, trust chain and registry certificate? |
| Authentication challenge or denial | Expected challenge flow, valid identity and correct repository scope? |
| Manifest unknown / tag missing | Correct repository and reference? Was this artifact published? |
| No matching platform | Does the index contain the required OS, architecture and variant? |
| Content verified, runtime fails | Executable, mount, policy or application issue after transfer? |

A `401` challenge can be a normal part of login/token negotiation, not proof
that the registry is offline. Similarly, a denied push isn't fixed by giving
the application container extra Linux capabilities.

The optional publication exercise checks the account and repository selected
for that handover. It doesn't validate an organization's identity policy,
credential lifecycle or registry availability.

## A registry is storage with an operational lifecycle

The registry stores uploaded manifests and blobs independently of your
engine's cache. A cached image can still run after an artifact disappears
from its repository, while a fresh receiver can no longer retrieve it.
For a registry you operate, plan durable storage, access policy, backups,
retention and recovery; with a hosted registry, understand the provider's
policy rather than treating local cache as a backup.

Tags also need a policy. Some registries support immutable tags, scanning,
signatures, replication or lifecycle rules; those are deployment features,
not automatic consequences of saying "OCI-compatible".

Deleting one tag doesn't necessarily reclaim every referenced blob immediately.
Retention and garbage collection must understand references and the registry
implementation. Don't manually remove files from a live registry volume to
make disk usage look better.

## Identity isn't trust

A digest makes a strong content-identity claim. It doesn't establish who built
the content, what source produced it or whether its dependencies are safe.
Signing, provenance, SBOMs and vulnerability assessment add different evidence.
They remain outside the current course; digest inspection alone is not a
complete supply-chain assessment.

For now, your handover should identify a retrievable artifact, name the intended
platform and keep authentication material separate from the image. That's
already much more useful than "pull latest and hope".

For deeper protocol boundaries, see the optional
[OCI image and distribution explanation](../runtime-architecture/04-oci-image-and-distribution-specs.md).
Next, [platforms and execution compatibility](platforms-and-execution-compatibility.md).

## References

- [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec)
- [Docker login](https://docs.docker.com/reference/cli/docker/login/)
- [Registry deployment guidance](https://distribution.github.io/distribution/about/deploying/)
