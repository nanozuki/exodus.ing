# src/lib/server/transport

Request handling shared by hooks, remote functions, and route handlers: cookies,
request data, redirect targets, and `App.Locals`. Each module owns its cookies
end to end: names, attributes, reads, writes, and deletion, so callers handle a
cookie only through its module's functions. Transport may call use cases and
repositories; models, use cases, repositories, and adapters never import it.
Importing a module performs no database, network, or cookie operation.

Follow the
[request boundary conventions](../../../../docs/architecture.md#request-boundaries-and-remote-functions)
for what transport decides and what it leaves to use cases.
