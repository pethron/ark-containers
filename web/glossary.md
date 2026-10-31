# Glossary

These are the terms the course uses across modules, each with a short
definition and a link to the chapter where it's explained with an example.
The definitions are reminders, so if one doesn't make sense on its own,
follow the link and read it where it first came up.

- **Anonymous volume**: a volume with a random hexadecimal name, created when
  a container asks for a volume without naming it, for example through an
  image's `VOLUME` instruction.
  [Storage](05-storage/02-where-container-files-live.md#a-volume-has-its-own-lifecycle)
- **Backup**: a copy of the data kept somewhere else, together with a restore
  you've actually tried.
  [Storage](05-storage/04-back-up-and-restore-the-notes.md)
- **Bind mount**: a file or directory from your computer that appears inside
  the container at a path you choose, following the host's owners and
  permissions; with `readonly`, the container can read it but not change it.
  [Why containers](01-why-containers/04-make-it-yours.md#read-the-launch-command),
  [Storage](05-storage/03-choose-a-volume-bind-mount-or-tmpfs.md#a-bind-mount-for-code-youre-editing)
- **Bridge**: the virtual switch Docker plugs the containers of a network
  into, so they can talk to each other, each with its own address and ports.
  [Networking](06-networking/02-how-the-request-finds-the-api.md#picture-the-trip)
- **Build cache**: stored results of earlier build steps, reused while a
  step's instruction, starting state and source files are unchanged.
  [Building images](04-building-images/02-build-cache-and-build-context.md#why-one-edit-repeats-some-work)
- **Build context**: the set of local files, chosen by the last argument of
  `docker build`, that `COPY` can take from.
  [Building images](04-building-images/01-package-the-service-in-an-image.md#build-the-image)
- **cgroups (control groups)**: a Linux feature that groups processes so the
  kernel can account for and, when you ask, limit the CPU, memory and number
  of processes they use. Docker creates one per container and sets no limits
  unless you do.
  [Running containers](02-running-containers/02-inside-the-running-container.md#what-makes-this-process-a-container)
- **chroot**: a Unix system call from 1979 that changes the directory a
  process treats as `/`. It restricts path lookup without giving a full
  isolation boundary.
  [Why containers](01-why-containers/07-a-short-history-of-isolation-chroot-to-oci.md#start-with-the-filesystem-chroot)
- **CMD**: the default command recorded in an image, run when nothing follows
  the image name in `docker run`.
  [Building images](04-building-images/01-package-the-service-in-an-image.md#read-the-recipe-first)
- **Compose (Docker Compose)**: a tool that describes a multi-container
  application in a file and starts it with one command.
  [Compose](07-compose/01-describe-the-stack-in-a-file.md)
- **`compose.yaml`**: the YAML file that describes a stack, where indentation
  shows what belongs to what and each `docker run` option has its place.
  [Compose](07-compose/01-describe-the-stack-in-a-file.md#from-commands-to-a-file)
- **Connection error**: the address of a service was found, but nothing
  answered on the port you called; compare the port in the URL with the one
  the service listens on.
  [Networking](06-networking/03-diagnose-a-broken-connection.md#the-frontend-calls-the-wrong-port)
- **Container**: a process on a Linux host, started with its own filesystem
  and dependencies and isolated from the other processes on the machine.
  [Why containers](01-why-containers/01-the-problem-containers-solve.md#so-what-is-a-container)
- **Copy-on-write**: a container changes an image file by first copying it
  into its own writable layer, so many containers can share one image.
  [Storage](05-storage/02-where-container-files-live.md#layers-a-writable-layer-and-mounts)
- **Default network**: the network Docker attaches a container to when you
  don't choose one; containers there can reach each other by address but
  can't find each other by name.
  [Networking](06-networking/01-connect-two-services.md#let-the-frontend-call-the-api)
- **Desired state**: what `compose.yaml` asks for. `docker compose up`
  compares it with what's running and changes only the difference.
  [Compose](07-compose/02-what-compose-manages-for-you.md#up-compares-then-acts)
- **Digest**: a content identifier, written as `sha256:...`, used in
  references such as `repository@sha256:...` to select exact content from a
  registry.
  [Images and registries](03-images-and-registries/05-choose-the-reference-to-hand-over.md#names-help-people-identity-helps-comparisons)
- **`docker compose down`**: removes a project's containers and network and
  keeps its images and named volumes; `down -v` also deletes the named
  volumes, and their data with them.
  [Compose](07-compose/02-what-compose-manages-for-you.md#what-down-removes-and-what-it-keeps)
- **`docker diff`**: lists the files a container has added, changed or
  deleted compared with its image.
  [Storage](05-storage/02-where-container-files-live.md#ask-docker-what-the-container-changed)
- **`docker exec`**: starts an extra process, such as a shell, inside a
  container that is already running, without replacing its main process.
  [Running containers](02-running-containers/02-inside-the-running-container.md#open-a-shell-alongside-the-server)
- **`docker restart`**: stops and starts the same container with the settings
  it already has, so it can't apply a new configuration.
  [Running containers](02-running-containers/03-restarting-isnt-replacing.md#replace-the-configuration)
- **Dockerfile**: the recipe of instructions Docker follows, in order, to
  build an image.
  [Building images](04-building-images/01-package-the-service-in-an-image.md)
- **`.dockerignore`**: a list of patterns that decides which files of the
  build context reach the builder.
  [Building images](04-building-images/03-write-the-services-dockerfile.md#keep-the-context-deliberate)
- **Entrypoint**: the executable part of a container's start, which stays when
  arguments after the image name replace `CMD`.
  [Building images](04-building-images/04-commands-and-signals.md#one-instruction-runs-now-two-record-a-later-start)
- **Environment**: everything code needs around it to run: the runtime,
  libraries, system packages, variables and configuration files.
  [Why containers](01-why-containers/01-the-problem-containers-solve.md#your-application-is-more-than-your-code)
- **Environment drift**: the slow way environments running the same software
  grow apart, one update at a time, without anyone deciding it.
  [Why containers](01-why-containers/01-the-problem-containers-solve.md#your-application-is-more-than-your-code)
- **Environment variable**: a named value, passed with `-e`, that the
  application reads when it starts, such as `MESSAGE`.
  [Why containers](01-why-containers/04-make-it-yours.md#change-the-message)
- **Exec form**: the JSON-array form of `CMD` or `ENTRYPOINT`, which passes
  arguments directly with no shell to interpret them.
  [Building images](04-building-images/04-commands-and-signals.md#when-a-shell-is-part-of-the-job)
- **`EXPOSE`**: documents the port an application listens on inside its
  container, without publishing it.
  [Building images](04-building-images/03-write-the-services-dockerfile.md#choose-the-inputs-and-defaults)
- **`Exited (0)`**: the status of a container whose main process has
  finished; `0` conventionally means it completed successfully.
  [Running containers](02-running-containers/02-inside-the-running-container.md#a-process-can-finish-without-failing)
- **Hypervisor**: the component that runs virtual machines and manages their
  access to the real hardware.
  [Why containers](01-why-containers/06-from-physical-servers-to-virtual-machines.md#a-machine-that-isnt-physical)
- **Image**: the read-only files and default settings from which containers
  are created, identified by an ID derived from its content.
  [Images and registries](03-images-and-registries/03-what-an-image-contains.md)
- **Image archive**: a `.tar` file written by `docker image save`, holding an
  image's layers, configuration and tag so that `docker image load` can
  restore it elsewhere.
  [Images and registries](03-images-and-registries/04-transfer-an-image-locally.md#save-the-named-image)
- **Image ID**: the long `sha256:` value Docker derives from an image's
  content, which lets you check that two names or two machines refer to the
  same image.
  [Images and registries](03-images-and-registries/01-find-the-image-behind-the-container.md#find-what-docker-already-has)
- **Layer**: one step in the sequence of filesystem changes that makes up an
  image's files; related images can share layers.
  [Images and registries](03-images-and-registries/03-what-an-image-contains.md#files-arrive-in-layers)
- **Loopback address (`127.0.0.1`)**: the address only your own computer can
  reach, so a port published there stays private to you.
  [Networking](06-networking/01-connect-two-services.md#let-the-frontend-call-the-api)
- **Main process (PID 1)**: the process started by a container's command; the
  container runs as long as it does.
  [Running containers](02-running-containers/02-inside-the-running-container.md#which-process-keeps-the-container-alive)
- **Name resolution**: turning a name such as `ark-api` into an address. When
  it fails, check the spelling and which network each container is on.
  [Networking](06-networking/03-diagnose-a-broken-connection.md#the-api-leaves-the-network)
- **Name server (`127.0.0.11`)**: the small name server Docker provides to
  containers on networks you create, answering each lookup with a container's
  current address.
  [Networking](06-networking/02-how-the-request-finds-the-api.md#look-at-the-network)
- **Namespaces**: Linux features that give a process its own view of a kind
  of resource, such as the process list, mounts, network or host name, so the
  container sees only its own.
  [Running containers](02-running-containers/02-inside-the-running-container.md#what-makes-this-process-a-container)
- **OCI (Open Container Initiative)**: the project that maintains the shared
  specifications for images, runtimes and registries, so that different
  tools can handle the same containers.
  [Why containers](01-why-containers/07-a-short-history-of-isolation-chroot-to-oci.md#agreeing-on-the-box-oci),
  [Images and registries](03-images-and-registries/04-transfer-an-image-locally.md#a-standard-format-inside-the-archive)
- **Platform**: the operating system and CPU architecture an image targets,
  such as `linux/amd64`, which the machine running it must support.
  [Images and registries](03-images-and-registries/05-choose-the-reference-to-hand-over.md#check-the-receiving-platform)
- **Port mapping (published port)**: a `-p` setting that forwards connections
  arriving at a host address and port to the port where the application
  listens inside the container.
  [Why containers](01-why-containers/04-make-it-yours.md#read-the-launch-command),
  [Networking](06-networking/01-connect-two-services.md#only-the-frontend-is-published)
- **Project (Compose)**: the name Compose gives a whole application and uses
  to name and label everything it creates.
  [Compose](07-compose/02-what-compose-manages-for-you.md#everything-belongs-to-a-project)
- **Registry**: a shared place that stores images: you publish with `push`,
  and others retrieve with `pull`.
  [Images and registries](03-images-and-registries/05-choose-the-reference-to-hand-over.md#where-a-registry-fits)
- **Replacement**: a new container created from an image, possibly with the
  old name, that starts from fresh files and none of the old instance's
  changes.
  [Running containers](02-running-containers/03-restarting-isnt-replacing.md#replace-the-configuration)
- **Repository**: the part of an image reference before the colon, such as
  `python`, which groups the images a publisher releases under one name.
  [Images and registries](03-images-and-registries/02-one-image-several-names.md#read-the-reference-weve-been-using)
- **Service (Compose)**: one part of an application that runs as a container,
  declared under `services`; other services reach it by its service name.
  [Compose](07-compose/02-what-compose-manages-for-you.md#services-find-each-other-by-name)
- **Signal**: an operating-system notification to a process. `docker stop`
  sends `SIGTERM` to the main process and, if it hasn't exited after the grace
  period, `SIGKILL`.
  [Running containers](02-running-containers/04-stopping-a-service.md#what-docker-waits-for),
  [Building images](04-building-images/04-commands-and-signals.md#follow-the-process-that-receives-stop)
- **Stateless container**: a container that keeps nothing important in its
  writable layer, so it can be removed and recreated at any time.
  [Storage](05-storage/02-where-container-files-live.md#what-survives-what)
- **Storage driver (snapshotter)**: the component that stacks an image's
  layers and the container's writable layer into one filesystem, OverlayFS on
  most Linux hosts.
  [Images and registries](03-images-and-registries/03-what-an-image-contains.md#stacking-layers-into-one-filesystem)
- **Tag**: the part of an image reference after the colon, such as
  `3.12-alpine`, a name the publisher chooses and can later move to other
  content.
  [Images and registries](03-images-and-registries/02-one-image-several-names.md#read-the-reference-weve-been-using)
- **tmpfs mount**: a mount whose files live in memory and disappear when the
  container stops.
  [Storage](05-storage/03-choose-a-volume-bind-mount-or-tmpfs.md#tmpfs-for-files-that-should-disappear)
- **Union filesystem**: a filesystem that presents several stacked directories
  as one, so a container sees the image's layers and its own changes as a
  single tree.
  [Images and registries](03-images-and-registries/03-what-an-image-contains.md#stacking-layers-into-one-filesystem)
- **User-defined network**: a network you create with
  `docker network create`, which gives the containers on it a name service so
  they can find each other by name.
  [Networking](06-networking/01-connect-two-services.md#give-them-a-network-of-their-own)
- **`USER`**: the Dockerfile instruction that sets the account running the
  following instructions and the service, so that it doesn't run as root.
  [Building images](04-building-images/01-package-the-service-in-an-image.md#who-runs-the-service)
- **Virtual machine**: a software-defined computer with virtual hardware, on
  which a guest operating system runs its own kernel.
  [Why containers](01-why-containers/06-from-physical-servers-to-virtual-machines.md#a-machine-that-isnt-physical)
- **Volume**: storage that Docker creates and manages, usually under a name
  you choose, and that outlives any container mounting it.
  [Storage](05-storage/01-give-the-service-a-memory.md#keep-the-notes-in-a-volume)
- **Writable layer**: each container's own layer for new and changed files,
  kept through stop and start and deleted with the container.
  [Running containers](02-running-containers/02-inside-the-running-container.md#open-a-shell-alongside-the-server),
  [Storage](05-storage/02-where-container-files-live.md#layers-a-writable-layer-and-mounts)
