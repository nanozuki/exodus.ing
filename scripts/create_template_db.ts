import { readFile } from 'node:fs/promises';
import { ADMIN_DB_NAME, buildDatabaseUrl, seedData, TEMPLATE_DB_NAME, withDatabase } from '../src/lib/testing/database';

export async function createTemplateDatabase(): Promise<void> {
  await withDatabase(ADMIN_DB_NAME, async (client) => {
    // disconnect all other clients from the template database
    await client.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [TEMPLATE_DB_NAME],
    );
    await client.query(`DROP DATABASE IF EXISTS "${TEMPLATE_DB_NAME}"`);
    await client.query(`CREATE DATABASE "${TEMPLATE_DB_NAME}"`);
  });

  // migrate schema
  const schemaSql = await readFile(new URL('./database.sql', import.meta.url), 'utf-8');
  await withDatabase(TEMPLATE_DB_NAME, async (templateClient) => {
    await templateClient.query(schemaSql);
  });

  await seedData(buildDatabaseUrl(TEMPLATE_DB_NAME));
  console.log(`[TEMPLATE-DB] created ${TEMPLATE_DB_NAME}`);
}

await createTemplateDatabase();
