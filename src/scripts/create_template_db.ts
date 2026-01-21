import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildDatabaseUrl, DB_NAME } from '$lib/server/repositories';
import { withDatabase, seedE2EData } from './lib/db';

export async function recreateTemplateDatabase(): Promise<void> {
  await withDatabase(DB_NAME.admin, async (client) => {
    await client.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [DB_NAME.template],
    );
    await client.query(`DROP DATABASE IF EXISTS "${DB_NAME.template}"`);
    await client.query(`CREATE DATABASE "${DB_NAME.template}"`);
  });

  const schemaSql = await readFile(new URL('../lib/server/repositories/database.sql', import.meta.url), 'utf-8');
  await withDatabase(DB_NAME.template, async (templateClient) => {
    await templateClient.query(schemaSql);
  });

  await seedE2EData(buildDatabaseUrl(DB_NAME.template));
  console.log(`[TEMPLATE-DB] created ${DB_NAME.template}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  await recreateTemplateDatabase();
}
