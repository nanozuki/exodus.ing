import { DB_NAME } from '$lib/server/repositories';
import { recreateTemplateDatabase } from './create_template_db';
import { withDatabase } from './lib/db';

async function recreateDevDatabase(): Promise<void> {
  const templateExists = await withDatabase(DB_NAME.admin, async (client) => {
    const templateResult = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME.template]);
    return (templateResult.rowCount ?? 0) > 0;
  });

  if (!templateExists) {
    await recreateTemplateDatabase();
  }

  await withDatabase(DB_NAME.admin, async (client) => {
    await client.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [DB_NAME.app],
    );
    await client.query(`DROP DATABASE IF EXISTS "${DB_NAME.app}"`);
    await client.query(`CREATE DATABASE "${DB_NAME.app}" WITH TEMPLATE "${DB_NAME.template}"`);
  });

  console.log(`[DEV-DB] created ${DB_NAME.app} from ${DB_NAME.template}`);
}

await recreateDevDatabase();
