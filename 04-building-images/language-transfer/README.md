# The same contract in Node.js

The [packaging kata](../katas/README.md#transfer-the-recipe-to-another-application)
asks you to transfer the build decisions to an application beyond the guided
Python recipe. If you don't have an application of your own, use this supplied
JavaScript service for an explanation-only transfer. You don't need to learn
JavaScript or install Node.js locally.

[server.mjs](server.mjs) uses Node.js's built-in HTTP server, listens on port
8000, and returns the same JSON message and health responses as the original.
`MESSAGE` changes its message, and unknown paths return HTTP 404. There are
no third-party dependencies to install.

Use the official `node:24-alpine` image as the reference runtime. It supplies
Node.js and an existing application account named `node`, which you can select
with `USER node` instead of creating `ark`. Keep code root-owned and readable
by that account, just as in the Python recipe.

Your transfer sketch should identify the base, copied file, code directory,
user and complete default command. The executable is `node` and its argument
is the path where you place `server.mjs`; the dependency stage of the Python
recipe has no job in this application. Explain which inputs a `.dockerignore` should
allow and which launch settings stay outside the image.

Building this second image is optional. If you do, use Docker from Linux Bash
or PowerShell 7, with `sudo` on Linux Engine if required, and select unused
image/container names and a free loopback port. Check `/`, `/health`, the
configured message, the application user and absence of mounts. Stop and
remove that named container before removing your output tag; retain the
supplied source file. Native execution on other platforms remains a separate
test.

The [official Node image documentation](https://github.com/nodejs/docker-node#how-to-use-this-image)
describes the runtime image. Return to the
[kata review](../katas/README.md#review-the-trade-off-and-reset) with an
explanation of which decisions transferred and which depended on Python.
