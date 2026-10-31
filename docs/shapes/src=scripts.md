# src/scripts

Dispatch checkout-local PostgreSQL maintenance commands and expose the
import-executed article-count migration. Child directory lib owns provisioning,
process lifecycle, and seeding.

## Files

### `src/scripts/migrate_article_counts.ts`

Import-time effect: await migrateArticlesCounts immediately. Importing this
script reads environment configuration and performs database writes. It does not
expose pool cleanup or close the database explicitly.

#### `migrateArticlesCounts`

```typescript
export declare function migrateArticlesCounts(): Promise<void>;
```

Read all article IDs/paths, count current comments and bookmarks per article,
and count direct child article paths. Update persisted interaction counts for
each article and log progress. Operations across articles are not one
transaction; failures leave earlier updates applied. Each call constructs its
own configured database through `src/lib/server/db`; table imports come from
`db/schema.ts`.

### `src/scripts/pg.ts`

Implicit CLI entry point: read process.argv on module evaluation. `start <name>`
ensures a clone; `reset <name|template>` deletes explicitly selected state;
`stop` runs stopPostgres under the control lock; `status` prints process JSON or
`{ status: "Stopped" }`. Invalid forms throw usage guidance. start/reset reject
extra arguments; status/stop test only that name is absent. Top-level failures
propagate to the process. Importing this module executes CLI dispatch.
