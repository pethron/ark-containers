# 02: Running containers

Before opening this module, try to recall the first service you ran: which
part of the launch command chose its message, and what did you have to do to
change it? Hold on to that answer, because this module starts from the same
kind of change.

The service works, and now someone wants to change it, stop it tonight and
start it again tomorrow. Which of those actions keep its files and settings,
and which give you a brand new instance? Getting this wrong is how a
configuration change silently disappears, or how an old setting survives
when you thought you had replaced it.

We'll pick up a copy of the message service that lives in this module's
directory, open a shell beside it and leave a file inside the running
container. Seeing the server and the shell as separate processes explains what
keeps a container alive, and the file shows what remains when execution ends.
From there we'll follow a configuration change from the working service to its
replacement, and finish by stopping the service and checking whether it
actually shut down cleanly.

You won't need to install Python, download the course files or build an image
here. Everything runs from the course's message service image, so the attention
stays on the life of the container itself.
