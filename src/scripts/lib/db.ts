import { buildDatabaseUrl } from '$lib/server/repositories';
import { Client } from 'pg';

export async function withDatabase<T>(dbName: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: buildDatabaseUrl(dbName) });
  await client.connect();
  const result = await fn(client);
  await client.end();
  return result;
}
