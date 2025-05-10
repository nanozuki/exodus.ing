import { schema } from '$lib/server/repositories/schema';
import { createClient } from '@libsql/client/sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '$env/dynamic/private';

export async function getDatabase() {
  const start = Date.now();
  const client = createClient({ url: env.DATABASE_URL! });
  const db = drizzle(client, { schema, logger: true });
  const duration = Date.now() - start;
  console.log(`[CONNECT-DATABASE] connected D1 database in ${duration}ms`);
  return db;
}
