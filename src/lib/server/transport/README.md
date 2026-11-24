# src/lib/server/transport

Request handling shared by hooks, remote functions, and route handlers: cookies,
request data, redirect targets, and `App.Locals`, translated to and from
use-case inputs and outputs. Transport may call use cases and repositories;
models, use cases, repositories, and adapters never import it. Importing a
module performs no database, network, or cookie operation.
