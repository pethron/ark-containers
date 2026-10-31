# 01: Why containers

"It works on my machine" is a joke every developer has heard, and usually a
problem someone else inherits. Picture a small HTTP service that runs fine on
your laptop, and a colleague who needs to run it too, without installing its
Python runtime or reproducing your setup by hand. That handover is the task
of this module, and it's the reason containers became part of everyday work.

We'll start by getting the service running in a container, so you have a
working result in front of you before any theory. Then you'll read the
command that started it, change its message, break it on purpose and run a
second copy beside the first. Each step changes one thing, and each change
gets an explanation once you've seen what it does. You don't need prior Linux
administration experience: ports and settings appear when the service needs them.

Once the service has worked and failed in front of you, we'll step back. Where
did containers come from, what did physical servers and virtual machines
already solve, and what does a container actually keep separate? Those
chapters need nothing running, and they give the commands you typed a place
in a longer story.

Keep one question with you while you work: when Docker says a container is
running, what exactly do you know about the service inside it? By the end of
the module you should have a precise answer, and a good reason for it.
