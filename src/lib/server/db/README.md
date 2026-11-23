# src/lib/server/db

PostgreSQL connection construction, schema declarations, inferred storage row
types, and the SQL schema generated from them for local database tooling.
Consumers are repositories, the server composition boundary, and database
management scripts. Business workflows and repository composition belong to
their owning modules.

`database.sql` is the schema that provisioning runs in a newly created template
database, generated from `schema.ts` by `pnpm db:export`; edit `schema.ts` and
regenerate rather than editing it. Its unconditional `CREATE` statements are not
an idempotent migration, so existing databases are not upgraded. It declares no
foreign keys.
