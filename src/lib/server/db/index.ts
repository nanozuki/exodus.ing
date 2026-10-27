import { schema, type AppDatabase } from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Config } from '../config';

// Construction does not issue a readiness query or confirm that PostgreSQL is reachable.
export async function getDatabase(config: Config): Promise<AppDatabase> {
  const start = Date.now();
  const db = drizzle({ connection: config.database, schema, logger: true });
  console.log(`[CONNECT-DATABASE] connected database in ${Date.now() - start}ms`);
  return db;
}
