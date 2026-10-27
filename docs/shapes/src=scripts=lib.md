# src/scripts/lib

Manage checkout-local PostgreSQL processes, seeded template databases, isolated clones, and destructive resets
explicitly requested by development/test callers.

## Files

### `src/scripts/lib/database.ts`

#### `ensureDatabase`

```typescript
export declare function ensureDatabase(name: string): Promise<void>;
```

Accept a 1–56 character lowercase ASCII suffix beginning with a letter or digit, using letters/digits/underscore/hyphen;
reject template and all. Under the checkout control lock, ensure PostgreSQL, then serialize database management with a
PostgreSQL session advisory lock. Fingerprint `src/lib/server/db/database.sql` and `src/lib/testing/data.ts` with SHA-256. Initialize exodus-template
from template0, execute schema, seed it, and publish a version only after completion. Clone a missing `exodus-<name>`
from the seeded template. Preserve existing clones and reject outdated or missing initialization records with explicit
reset guidance. Do not alter connection environment variables. Clients and locks are released on exit paths; partial
databases are preserved after failure.

#### `resetDatabase`

```typescript
export declare function resetDatabase(name: string): Promise<void>;
```

Under the same control/advisory locks, force-drop the named exodus database and remove its version record. The special
template argument drops every database whose name starts with exodus-, removes version files, and leaves the cluster
running. Unrelated databases are preserved. This is destructive, explicit maintenance; startup does not silently reset
data.

### `src/scripts/lib/postgres.ts`

#### `withControlLock`

```typescript
export declare function withControlLock<T>(fn: () => Promise<T>): Promise<T>;
```

Create the checkout .direnv directory and atomically acquire pg-control.lock. Wait in 100ms intervals up to 120 seconds;
release in finally. Stale locks require manual investigation/removal. The helper is not reentrant.

#### `postgresStatus`

```typescript
export declare function postgresStatus(): Promise<
  | {
      name: string;
      is_running: boolean;
      exit_code: number;
    }[]
  | null
>;
```

Run the checkout-pinned `nix run .#pg -- process list -o json` with a 120-second subprocess bound. Return parsed process
states, or null only for a missing/refused Unix control socket. Propagate other configuration, process, or parsing
failures.

#### `ensurePostgres`

```typescript
export declare function ensurePostgres(): Promise<void>;
```

Call while holding the control lock. Start the process manager if absent, or restart the stopped pg process unless an
existing process reports failure. Wait up to 30 seconds for SQL readiness, retrying only connection-refused/reset or
startup codes. Confirm the connected server data_directory resolves to this checkout’s .direnv/pg; refuse another
cluster. Each probe closes its Client.

#### `stopPostgres`

```typescript
export declare function stopPostgres(): Promise<void>;
```

Call under the control lock. Shut down an existing manager, then wait up to 30 seconds for its recorded postmaster PID
to exit. Reject invalid PID files or a surviving process; absent PID files or nonexistent processes indicate completion.
Data deletion is not this operation’s responsibility.

### `src/scripts/lib/seed.ts`

#### `seedE2EData`

```typescript
export declare function seedE2EData(client: Client): Promise<void>;
```

Use table/schema declarations from `src/lib/server/db/schema.ts`. Use the supplied connected pg Client to delete existing rows from all application tables and insert the shared test
dataset in one transaction, including user roles. Reset the invitation sequence to the maximum inserted ID. Preserve the
caller’s ownership of the Client; transaction failures roll back and propagate. Log inserted collection counts. Despite
use for fresh templates, calling it on an existing database replaces that database’s application data.
