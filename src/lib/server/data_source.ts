import { schema } from '$lib/server/repositories/schema';
import { createClient } from '@libsql/client/sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '$env/dynamic/private';

if (!env.EXODUSING_DATABASE) {
  throw new Error('DATABASE_URL is not set');
}

export async function getDatabase() {
  const start = Date.now();
  const client = createClient({ url: env.EXODUSING_DATABASE });
  const db = drizzle(client, { schema, logger: true });
  const duration = Date.now() - start;
  console.log(`[CONNECT-DATABASE] connected D1 database in ${duration}ms`);
  return db;
}
