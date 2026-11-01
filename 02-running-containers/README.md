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

We'll run the message service, open a shell beside it and leave a file inside
the container. Seeing the server and the shell as separate processes explains
what keeps a container alive, and the file shows what remains when execution
ends. From there we'll follow a configuration change through replacement and
check what happens when the service stops.

Once we can operate the service, we'll follow a Docker request from the client
to the engine and compare the views and resource settings of two containers.
That gives us a more precise explanation for the process and filesystem
behavior we just saw.

You won't need to install Python, download the course files or build an image
here. Everything runs from the course's message service image, so the attention
stays on the life of the container itself.
