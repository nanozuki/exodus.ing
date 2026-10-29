# src/lib/server/testing

Provide isolated PostgreSQL databases for repository integration tests. Reuse
the checkout-local provisioning lifecycle; test cases exercise real SQL and
internal transactions without connecting to the development database.
Application code must not import this test-only module. Importing it performs no
I/O.

## Files

### `src/lib/server/testing/database.ts`

#### `TestDatabase`

```typescript
export interface TestDatabase {
  db: AppDatabase;
  close(): Promise<void>;
}
```

`db` belongs to one independently cloned test database. `close` releases its
connection pool before removing that owned clone; repeated cleanup is harmless.
Cleanup does not stop the shared PostgreSQL service or remove other databases.

#### `createTestDatabase`

```typescript
export declare function createTestDatabase(
  suite: string,
): Promise<TestDatabase>;
```

Create a uniquely named, test-owned clone using the existing `ensureDatabase`
workflow, seeded from the shared fixture dataset. Validate or normalize `suite`
into an accepted provisioning suffix and include a unique run identifier to
isolate concurrent callers. Use an explicitly selected database in a dedicated
pool without modifying process connection environment variables. Tests may
change their own clone freely and must call `close` in teardown. Failed setup
must close acquired connections; provisioning failures propagate with the
existing explicit reset guidance. Do not silently reset an outdated template or
access any existing development database.
