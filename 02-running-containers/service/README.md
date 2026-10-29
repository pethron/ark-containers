# The same service, with a shutdown experiment

[operations.py](operations.py) loads the original HTTP handler from
[the first application](../../01-why-containers/first-app/app.py). Its routes
and message configuration are unchanged. The launch command mounts the course
checkout read-only at `/course`; the wrapper locates the original handler from
its own position in that checkout. No local Python or `PYTHONPATH` setting is
needed. Keep the course directory layout intact.

The added wrapper provides three deliberate behaviors:

- `SHUTDOWN_MODE=graceful` (default): handle the stop request and shut down.
- `SHUTDOWN_MODE=ignore`: log those signals but keep serving until forcibly stopped.
- Any other value: explain the invalid configuration and stop with an error
  before starting the HTTP server.

Use the [operations walkthrough](../01-observe-a-running-service.md) for launch,
checks and cleanup. The wrapper is a teaching fixture, not a production server.
It doesn't implement a durable work queue, transaction draining or a full
shutdown deadline policy. In-flight request handling is still limited by
Python's standard-library HTTP server.
