#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  printf 'Run with sudo on a disposable systemd Linux VM.\n' >&2
  exit 1
fi
for command in systemd-run unshare mount chroot file mktemp busybox; do
  if ! command -v "$command" >/dev/null; then
    printf 'Missing prerequisite: %s\n' "$command" >&2
    exit 1
  fi
done
if [[ ! -d /run/systemd/system ]]; then
  printf 'This lab requires a VM booted with systemd.\n' >&2
  exit 1
fi
busybox=$(command -v busybox)
if ! file -L "$busybox" | grep -Eq 'statically linked|static-pie linked'; then
  printf 'Install busybox-static; the rootfs cannot use a dynamic BusyBox.\n' >&2
  exit 1
fi
root=$(mktemp -d /tmp/ark-manual.XXXXXX)
scope="ark-manual-$$"
trap 'rmdir -- "$root"' EXIT
printf 'Temporary mountpoint: %s\nScope: %s.scope\n' "$root" "$scope"
systemd-run --scope --unit="$scope" \
  -p MemoryMax=64M -p MemorySwapMax=0 -p TasksMax=32 \
  unshare --mount --pid --fork --kill-child=SIGKILL --uts --ipc --net \
  /bin/bash -eu -c '
    root=$1
    busybox=$2
    mount --make-rprivate /
    mount -t tmpfs -o size=16m,mode=755 tmpfs "$root"
    mkdir -p "$root/bin" "$root/proc"
    cp -- "$busybox" "$root/bin/busybox"
    ln -s busybox "$root/bin/sh"
    exec chroot "$root" /bin/busybox sh -eu -c "
      /bin/busybox --install -s /bin
      mount -t proc proc /proc
      hostname ark-manual
      export PATH=/bin
      echo \"Manual sandbox: run the documented checks, then exit.\"
      exec /bin/sh
    "
  ' ark-manual "$root" "$busybox"
printf 'Sandbox exited; namespace-local mounts have been released.\n'
