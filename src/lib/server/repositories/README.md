# src/lib/server/repositories

Database reads, writes, model mapping, and internal transactions for articles,
bookmarks, comments, invitations, roles, sessions, and users. Each operation is
a standalone exported function that takes `AppDatabase` from
`src/lib/server/db/schema.ts` as its first parameter; operation-specific object
parameters are exported as `XxxParams` beside their function, and shared models
such as `Session` can serve directly as inputs. Importing a module performs no
queries.

Follow the
[repository conventions](../../../../docs/architecture.md#repositories) for
function structure, data shapes, naming, errors, and transactions.

Use cases own permissions, business decisions, quota calculation, and session
lifetime policy; callers own request context, cookies, DNS, and frontend state.
Repositories generate storage identifiers and persistence timestamps, and keep
table constraints and identifier formats intact.

Paginated results echo the requested `pageNumber` and `pageSize`, return empty
`items` past the last page, and read the total `count` and the page rows from
one consistent snapshot. Every operation runs through `wrap` in `utils.ts`,
which logs it and normalizes its failures.
