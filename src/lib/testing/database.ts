import { Client } from 'pg';
import { schema } from '$lib/server/repositories/schema';
import { getConfig } from '$lib/server/config';
import { testDataset } from '$lib/testing/data';
import { connectDatabase } from '$lib/server/repositories';

export const TEMPLATE_DB_NAME = 'exodus-template';
export const ADMIN_DB_NAME = 'postgres';

export function buildDatabaseUrl(dbName: string): string {
  const url = new URL(getConfig().EXODUSING_DATABASE);
  url.pathname = `/${dbName}`;
  return url.toString();
}

export async function withDatabase<T>(dbName: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: buildDatabaseUrl(dbName) });
  await client.connect();
  let result: T;
  try {
    result = await fn(client);
  } finally {
    await client.end();
  }
  return result;
}

const BUILD_DATABASE_LOCK_KEY = 1;

export async function buildDatabaseFromTemplate(dbName: string): Promise<void> {
  await withDatabase(ADMIN_DB_NAME, async (client) => {
    await client.query('SELECT pg_advisory_lock($1)', [BUILD_DATABASE_LOCK_KEY]);
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await client.query(`CREATE DATABASE "${dbName}" WITH TEMPLATE "${TEMPLATE_DB_NAME}"`);
    await client.query('SELECT pg_advisory_unlock($1)', [BUILD_DATABASE_LOCK_KEY]);
  });
  console.log(`[BUILD-DB] created ${dbName} from ${TEMPLATE_DB_NAME}`);
}

export async function seedData(databaseUrl: string): Promise<void> {
  const { users, articles, comments, bookmarks, userRoles, inviteCodes } = testDataset;
  const db = connectDatabase(databaseUrl);
  await db.transaction(async (tx) => {
    await tx.insert(schema.tUser).values(users);
    await tx.insert(schema.tUserRole).values(userRoles);
    await tx.insert(schema.tInviteCode).values(inviteCodes);
    await tx.insert(schema.tArticle).values(articles);
    await tx.insert(schema.tBookmark).values(bookmarks);
    await tx.insert(schema.tComment).values(comments);

    // set invite_code id sequence correctly
    await tx.execute(
      "SELECT setval(pg_get_serial_sequence('invite_code', 'id'), (SELECT COALESCE(MAX(id), 1) FROM invite_code))",
    );
  });

  console.log(`[SEED] inserted ${users.length} users`);
  console.log(`[SEED] inserted ${articles.length} articles`);
  console.log(`[SEED] inserted ${bookmarks.length} bookmarks`);
  console.log(`[SEED] inserted ${comments.length} comments`);
  console.log(`[SEED] inserted ${inviteCodes.length} invite codes`);
}
