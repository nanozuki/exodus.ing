# src/lib/server/use-cases

Server business operations that need external capabilities. Each operation takes
`deps`, only the capabilities it uses, and `params`, the invocation data.
Callers supply trusted authenticated actors, provider identities, parsed URLs,
and request-independent values; request entry points supply `now` from
`adapters/clock.ts`.

Use cases call repository functions with `deps.db`; repositories own
transactions and persistence consistency. Request boundaries own request
context, cookies, redirects, and remote-query refreshes. Use cases read neither
the service registry, environment variables, nor the current time.

Repository and adapter failures propagate. Expected business failures throw
tagged application errors, with field keys for correctable input. Markdown
compilation and business calculations stay inside the operation that needs them;
a separate exported function exists only for a business scenario that several
callers share.
