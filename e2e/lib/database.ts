import { buildDatabaseFromTemplate, buildDatabaseUrl } from '../../src/lib/testing/database';
import { buildServices } from '../../src/lib/server/registry';

export async function useTestDatabase(name: string) {
  await buildDatabaseFromTemplate(name);
  const pgUrl = buildDatabaseUrl(name);
  buildServices({ EXODUSING_DATABASE: pgUrl });
}
