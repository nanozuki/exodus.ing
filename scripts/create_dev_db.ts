import { buildDatabaseFromTemplate } from '../src/lib/testing/database';
import { getConfig } from '../src/lib/server/config';

async function createDevDatabase(): Promise<void> {
  const dbName = new URL(getConfig().EXODUSING_DATABASE).pathname.slice(1);
  await buildDatabaseFromTemplate(dbName);
}

await createDevDatabase();
