# exodus.ing

An article site for friends.

## Architecture and Development Conventions

Read [Architecture and Development Conventions](docs/architecture.md) for code
placement, layer responsibilities, use-case contracts, remote-function
co-location, and repository rules.

## Development environment

Construct the dev environment with the following steps.

### Setup local environment

Use nix-direnv and pnpm to construct environment:

```shell
echo "use flake" > .envrc
direnv allow
pnpm install
```

### Setup environment variables

Put the following environment variables in `.envrc` file:

```
export GITHUB_CLIENT_ID=<your-github-client-id>
export GITHUB_CLIENT_SECRET=<your-github-client-secret>
```

And execute `direnv allow` to load the environment variables.

### Setup database

PostgreSQL runs natively through Nix and Process Compose. No Docker setup is needed.

```shell
pnpm dev                  # Ensure exodus-dev exists, then start Vite
pnpm test:e2e             # Recreate exodus-e2e, then run Playwright
pnpm pg:status            # Show local process status as JSON
pnpm pg:stop              # Stop PostgreSQL, preserving data
pnpm pg:reset dev         # Delete only exodus-dev
pnpm pg:reset template    # Delete the template and every exodus-* database
pnpm test:script          # Run database tooling regression tests
```

The service runs in the background at `127.0.0.1:62545`, uses username
`exodus` and password `exodus`, and stores data in `.direnv/pg`. The control socket
is `.direnv/pg.sock`. Run `nix run .#pg -- attach` to open its TUI.

The Nix devShell exports `APP_URL=http://localhost:5173` and the local
PostgreSQL connection variables below. Application code has no local defaults;
set these variables explicitly when running outside the devShell:

```shell
export PGHOST=127.0.0.1
export PGPORT=62545
export PGUSER=exodus
export PGPASSWORD=exodus
export PGSSLMODE=disable
export PGDATABASE=exodus-dev
```

`PGDATABASE` is the actual database name. Development and E2E commands
set only this variable to `exodus-dev` and `exodus-e2e`, respectively. The internal
CLI accepts suffixes: `tsx src/scripts/pg.ts start dev` ensures `exodus-dev` exists. Drizzle's
`db:*` commands use the same configuration; for example,
`PGDATABASE=exodus-dev pnpm db:studio`.

Databases clone `exodus-template`, which contains the exported SQL schema and
shared seed data. The file `.direnv/pg_database_version` records a fingerprint for the template
and each clone, computed only from `database.sql` and `src/lib/testing/data.ts`.
No version metadata is inserted into the databases. Outdated or incomplete databases produce an
error; reset the named database and rerun the original command. After changing
the schema or seed, reset `template` to delete the template and all `exodus-`
databases, including development and test databases. The cluster stays running
and unrelated databases are preserved. Resetting a single database removes its
version entry; resetting the template removes the version file. Reset only deletes
state; the next ensure call recreates it.

Tests can import `ensureDatabase(name)` from `src/scripts/lib/database.ts` to
prepare an isolated database and call `resetDatabase(name)` for cleanup. Connect
with `new Client({ database: "exodus-" + name })`; node-postgres reads the
remaining connection settings directly from `PG*`. Use unique suffixes per concurrent worker or test case. `template` is reserved for resetting all project databases; the old `all` argument is unsupported;
other names allow 1–56 lowercase ASCII letters, digits, underscores and hyphens,
starting with a letter or digit. Resetting one database disconnects its clients.

Failures propagate without automatic repair. Inspect `.direnv/pg-process-compose.log`
and the process logs `.direnv/pg.log` and `.direnv/pg-init.log` for startup failures. Management operations serialize through
`.direnv/pg-control.lock`; after a forcibly terminated script, check that no
management command is running before manually removing a stale lock directory.

When upgrading an existing cluster created with the system username, changing the
flake does not recreate its roles or reset its password. Migrate the existing
role to `exodus` and set its password, or stop PostgreSQL and explicitly recreate
`.direnv/pg` after preserving any data you need. An old template without a file
version record requires `pnpm pg:reset template`, which deletes all `exodus-`
databases.

## Build

```shell
docker build .
# If you need cross-platform build, use the following command:
docker build --platform linux/amd64 .
```

## Stack

- Svelte and SvelteKit
- PostgreSQL
- Drizzle ORM
- Remark, Rehype ecosystem
