---
title: "Check your understanding"
track: kata
---

# Check your understanding

Our notes service now keeps its memory through replacements, and you've
backed that memory up and restored it. Try answering each question from memory
before you open its answer. If your guess turns out wrong, the link at the end
of the answer tells you which chapter to reread, and nobody is keeping score.

## 1. A restart with tmpfs

You start the notes service with a tmpfs mount at `/data`, as in the chapter
on choosing a mount, add a note and check that `/notes` lists it. Then you run
`docker restart ark-notes-scratch`. What will `/notes` show afterwards, and
what would it have shown if the container had no mount at `/data` at all?

<details>
<summary>Answer</summary>

The list will be empty. A tmpfs mount keeps its files in memory only while the
container runs, and `docker restart` stops the container before starting it
again, so the note disappears with the stop. Without a mount, the note would
have gone into the container's writable layer, which lasts as long as the
container exists, and the same restart would have kept it. Of the three
places, tmpfs has the shortest lifetime. See
[tmpfs for files that should disappear](03-choose-a-volume-bind-mount-or-tmpfs.md#tmpfs-for-files-that-should-disappear).

</details>

## 2. Notes in the wrong place

A colleague tells you their notes service keeps its data in a volume, but
they'd like a second opinion before deploying a new version. You add a note
and run `docker diff` on their container:

```text
C /data
A /data/notes.txt
```

What does this tell you about where the notes are going, what will happen
to them at the next replacement, and which command would show you what was
actually mounted?

<details>
<summary>Answer</summary>

`docker diff` lists the container's writable layer, and writes that go through
a mount never appear there. Seeing `notes.txt` added under `/data` means the
service is writing into its own writable layer, so no volume is mounted at
`/data`: perhaps the `--mount` option is missing, or its `target` names a
different path. Replacing the container as it stands would lose those notes
with its writable layer. `docker inspect --format '{{json .Mounts}}'` followed
by the container name shows each mount and its destination, so you can see
whether a volume exists and where it points. Compare with the empty output in
[Ask Docker what the container changed](02-where-container-files-live.md#ask-docker-what-the-container-changed).

</details>

## 3. A new volume that root owns

You start `ark-notes:v1` with a brand-new volume mounted at `/srv/notes` and
`NOTES_FILE` pointing inside it. The container exits straight away, and
`docker logs` shows:

```text
Cannot write notes file /srv/notes/notes.txt: Permission denied
```

The same image works perfectly with a new volume at `/data`. Which difference
explains the failure, which observation would confirm it, and where does the
fix belong?

<details>
<summary>Answer</summary>

When Docker mounts an empty volume where the image already has a directory,
it first copies that directory into the volume, owner and permissions
included. The image has an `ark`-owned `/data`, so a new volume there becomes
writable for `ark`, while it has no `/srv/notes`, so the new volume keeps the
default owner of a new mount point, root. A one-off container running
`ls -ld /srv/notes` with the same volume mounted confirms it by showing root as
the owner. The fix belongs in the image, which should prepare the directory its
service writes to, as `Dockerfile.srv` does, rather than in running the service
as root. The whole diagnosis is in
[A volume at a new path](03-choose-a-volume-bind-mount-or-tmpfs.md#a-volume-at-a-new-path).

</details>

## 4. Mounts for a development session

You're changing `app.py` and want to see each change after a quick restart,
without building a new image. At the same time, you'd like a handful of test
notes to survive while you replace the container several times with different
settings. Which mount would you use for the code and which for the notes,
and why?

<details>
<summary>Answer</summary>

For the code, a bind mount of the `notes-service` directory over `/app`,
read-only, makes the container run the file in your editor, and mounting the
directory rather than the single file keeps up with editors that save by
writing a new file. For the notes, a volume at `/data` survives every
replacement and gets an `ark`-owned directory from the image the first time
it's used. A bind mount for the notes can work too, but whether `ark` may write
there depends on your host's owners, permissions and file sharing, so it may
behave differently on a colleague's laptop. Whichever you choose, say why the
trade-off suits you. The comparison is in
[Choosing a mount](03-choose-a-volume-bind-mount-or-tmpfs.md#choosing-a-mount).

</details>

## 5. A volume that refuses to go

You've stopped `ark-notes`, which mounts `ark-notes-data`, and you run
`docker volume rm ark-notes-data`. Docker answers with `volume is in use`.
Why does a stopped container still block the removal, and why doesn't
`docker rm ark-notes` delete the volume for you?

<details>
<summary>Answer</summary>

A stopped container keeps its mounts so that the next `docker start` finds
everything as it was, so Docker counts it as a user of the volume until the
container itself is removed. Once every container using the volume is gone,
`docker volume rm` succeeds, but `docker rm` never takes a named volume along.
That asymmetry is deliberate: replacing containers is routine, while deleting
data should be a separate decision you make by name. Read more in
[A volume has its own lifecycle](02-where-container-files-live.md#a-volume-has-its-own-lifecycle).

</details>

## 6. Root for the restore

The service always runs as `ark`, yet the helper containers that back up and
restore the notes run `tar` as root. Listing the archive shows `1000/1000` as
the owner of `notes.txt`. Why did the restore need root, and what would go
wrong if the restored files ended up owned by a different user?

<details>
<summary>Answer</summary>

The archive records owners as numbers, and `1000/1000` is `ark` in our image.
The helper runs `tar` as root, which gives it the permission needed to restore
those recorded owners in this volume. The service only writes into a directory
it already owns, so it never needs that privilege. With the permissions in
this exercise, files restored as root would stop `ark` from saving notes,
which is why the chapter adds a note through the restored service as its final
check. See
[Restore into a new volume](04-back-up-and-restore-the-notes.md#restore-into-a-new-volume).

</details>

## 7. Looking back: why replacement shapes storage

In the module on running containers, giving the service a new message meant
removing the container and running a new one with the same name, because
`docker restart` reuses the settings the container already has. The note
written in `/tmp` didn't follow the name to the replacement. How does that
observation explain why the notes service needs a volume?

<details>
<summary>Answer</summary>

Launch settings are fixed when a container is created, so changing a setting
or deploying a new image means replacing the container, and every replacement
starts from the image with a fresh writable layer. The name is only a label;
the old writable files belonged to the removed container. If the notes lived
in the writable layer, every configuration change would erase them, so they
need storage whose lifetime is independent of any container and which the
replacement can mount again. The original experiment is in
[Restarting vs replacing a container](../02-running-containers/03-restarting-isnt-replacing.md#replace-the-configuration),
and the storage side is in
[What survives what](02-where-container-files-live.md#what-survives-what).

</details>

## 8. A writable mount that the service cannot write

Docker shows a volume mounted at `/data` with `"RW":true`, but the service
still reports `Permission denied`. Which other evidence would you inspect?

<details>
<summary>Answer</summary>

The mount permits writes in principle, while the process still needs access
under the directory's ownership and permissions. Compare `id` inside the
container with a numeric `ls -ldn` of the mounted path and its files. An
existing volume can retain an owner different from the one prepared in the
image. See [Why the owner mattered](05-how-a-mount-appears.md#why-the-owner-mattered).

</details>

When you're ready for a situation with less guidance, try the
[module kata](katas/README.md).
