# Runtime architecture

**Optional advanced deep dive, not required to complete the core course or
its final project.**

When you type `docker run`, several programs cooperate before Python starts
inside the container. This deep dive follows them with the message service
from the first module: the Docker engine receives the request, containerd and
its shim look after the container, and runc creates the process according to
the OCI runtime specification. Watching create, start and stop first gives
that component map a purpose.

From there we widen the view to the OCI image and distribution
specifications and where tools such as Podman fit, with a brief CRI note for
ecosystem context. The word "runtime" ends up meaning several different things in
this landscape, so a good part of the work is keeping OCI runtime
configuration, image content and CRI requests apart. If namespaces and
resource controls are unfamiliar, the Linux primitives deep dive explains them
and you can consult it as needed.

The last chapter is an optional lab that compares Docker with nerdctl and ctr,
the direct containerd clients. It needs a standalone Linux VM, separate from
your Docker setup, and states its prerequisites before the first command.

By the end, try to trace the request from the Docker CLI to the application
process and name who owns the object at each layer.
