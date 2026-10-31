import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schema, type AppDatabase } from '#lib/server/db/schema.js';
import { ensureDatabase, resetDatabase } from '../../../scripts/lib/database';

// Call close in teardown, including after failures. Repeated cleanup is harmless.
export interface TestDatabase {
  db: AppDatabase;
  close(): Promise<void>;
}

// The clone is independent of development data. An outdated template requires an explicit reset.
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
