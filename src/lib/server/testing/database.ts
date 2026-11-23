import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schema, type AppDatabase } from '#lib/server/db/schema.js';
import { ensureDatabase, resetDatabase } from '../../../scripts/lib/database';

/**
 * One test-owned database clone. `close` ends the pool and then drops the clone; call it in teardown, including after
 * failures. Repeated calls are harmless. Cleanup never stops the shared PostgreSQL service or removes other databases.
 */
export interface TestDatabase {
  db: AppDatabase;
  close(): Promise<void>;
}

/**
 * Clones the seeded fixture template into a new database named from `suite` (normalized into a valid name) and a
 * unique run ID, so concurrent callers never share one, and connects to it through a dedicated pool without changing
 * connection environment variables. Tests may change their clone freely. An outdated template is never reset
 * silently: provisioning fails with explicit reset guidance, and provisioning failures propagate. Connections acquired
 * by a failed setup are closed. The development database is never accessed.
 */
export async function createTestDatabase(suite: string): Promise<TestDatabase> {
  const slug =
    suite
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^[^a-z0-9]+/, '')
      .slice(0, 16) || 'suite';
  const suffix = `test-${slug}-${randomUUID().replaceAll('-', '')}`;
  await resetDatabase(suffix);
  await ensureDatabase(suffix);
  const pool = new Pool({ database: `exodus-${suffix}` });
  try {
    await pool.query('SELECT 1');
    const db = drizzle(pool, { schema });
    let cleanup: Promise<void> | undefined;
    return {
      db,
      close() {
        return (cleanup ??= (async () => {
          await pool.end();
          await resetDatabase(suffix);
        })());
      },
    };
  } catch (error) {
    await pool.end();
    throw error;
  }
}
