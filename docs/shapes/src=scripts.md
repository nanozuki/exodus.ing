# src/scripts

Dispatch checkout-local PostgreSQL maintenance commands, register provisioning integration checks, and expose the
import-executed article-count migration. Child directory lib owns provisioning, process lifecycle, and seeding.

## Files

### `src/scripts/migrate_article_counts.ts`

Import-time effect: await migrateArticlesCounts immediately. Importing this script reads environment configuration and
performs database writes. It does not expose pool cleanup or close the database explicitly.

#### `migrateArticlesCounts`

```typescript
export declare function migrateArticlesCounts(): Promise<void>;
```

Read all article IDs/paths, count current comments and bookmarks per article, and count direct child article paths.
Update persisted interaction counts for each article and log progress. Operations across articles are not one
transaction; failures leave earlier updates applied. Each call constructs its own configured database.

### `src/scripts/pg.integration.ts`

Implicit test entry point: register node:test cases for invalid suffixes, explicit configuration, seeded clone
preservation/version failure/scoped reset, concurrent process ensures, and template reset. The template-reset case
creates a separate temporary checkout/cluster, confirms unrelated databases survive, verifies schema push detects no
changes, checks wrong-password rejection and interrupted initialization, and stops/removes its temporary cluster in
cleanup. Other provisioning cases use isolated named clones in the current checkout. These tests were inspected, not
executed during this derivation.

### `src/scripts/pg.ts`

Implicit CLI entry point: read process.argv on module evaluation. `start <name>` ensures a clone;
`reset <name|template>` deletes explicitly selected state; `stop` runs stopPostgres under the control lock; `status`
prints process JSON or `{ status: "Stopped" }`. Invalid forms throw usage guidance. start/reset reject extra arguments;
status/stop test only that name is absent. Top-level failures propagate to the process. Importing this module executes
CLI dispatch.
