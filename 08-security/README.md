# 08: Security

## What you will learn

- User namespaces and rootless containers
- Capabilities, read-only filesystems, seccomp profiles
- Build-time and runtime credentials
- Supply chain: scanning, SBOM, signing

## Chapters

| # | Chapter | Track |
|---|---------|-------|
| 01 | [The container threat model](01-the-container-threat-model.md) | A |
| 02 | [User namespaces and rootless containers](02-user-namespaces-and-rootless-containers.md) | A |
| 03 | [Supply chain security](03-supply-chain-security.md) | A |
| 04 | [Hardening the runtime](04-hardening-the-runtime.md) | R |
| 05 | [Scanning, SBOM and signing](05-scanning-sbom-and-signing.md) | R |

Build-time secret handling belongs with credential and supply-chain decisions.
The [build-time secret exercise](build-secrets.md) uses only a dummy value and
the packaged service's optional Dockerfile.

## Katas

In [`katas/`](katas/). Planned:

- Harden an insecure Dockerfile and run config
