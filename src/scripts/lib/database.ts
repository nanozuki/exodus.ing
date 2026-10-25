/** Development/test database provisioning. Failures leave state intact for explicit developer reset. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
import { testDataset } from '../../lib/testing/data';
import { seedE2EData } from './seed';
import { ensurePostgres, withControlLock } from './postgres';

const template = 'exodus-template';

/** Accept a suffix for an isolated database; template is reserved for management; the legacy all argument is unsupported. */
function databaseName(name: string): string {
  if (!/^[a-z0-9][a-z0-9_-]{0,55}$/.test(name) || name === 'template' || name === 'all') {
    throw new Error(
      'Database name must be 1–56 lowercase ASCII letters, digits, underscores or hyphens; template is reserved and all is unsupported.',
    );
  }
  return `exodus-${name}`;
}

async function withDatabase<T>(name: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ database: name, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function withAdmin<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  return withDatabase('postgres', async (client) => {
    // A session lock permits CREATE/DROP DATABASE, which cannot run in a transaction.
    await client.query('SELECT pg_advisory_lock(62545, 1)');
    try {
      return await fn(client);
    } finally {
      await client.query('SELECT pg_advisory_unlock(62545, 1)');
    }
  });
}

async function databaseExists(client: Client, name: string): Promise<boolean> {
  return (await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])).rows.length > 0;
}

async function checkVersion(name: string, fingerprint: string): Promise<void> {
  const resetName = name.slice('exodus-'.length);
  await withDatabase(name, async (client) => {
    const result = await client.query("SELECT to_regclass('_exodus_database_version') AS name");
    if (!result.rows[0].name) {
      throw new Error(`${name} has no completed initialization record. Run pnpm pg:reset ${resetName}.`);
    }
    const version = await client.query('SELECT fingerprint FROM _exodus_database_version');
    if (version.rows.length !== 1 || version.rows[0].fingerprint !== fingerprint) {
      throw new Error(`${name} is outdated. Run pnpm pg:reset ${resetName}.`);
    }
  });
}

/** Ensure the local server, seeded template and named clone exist; preserve existing data without changing connection environment variables. */
export async function ensureDatabase(name: string): Promise<void> {
  const target = databaseName(name);
  return withControlLock(async () => {
    await ensurePostgres();
    const schemaSql = await readFile(new URL('../../lib/server/repositories/database.sql', import.meta.url), 'utf8');
    // Hash schema, initializer code, ORM mappings and the actual deterministic seed values.
    const hash = createHash('sha256').update(schemaSql).update(JSON.stringify(testDataset));
    for (const file of ['./database.ts', './seed.ts', '../../lib/server/repositories/schema.ts']) {
      hash.update(await readFile(new URL(file, import.meta.url)));
    }
    const fingerprint = hash.digest('hex');
    return withAdmin(async (client) => {
      if (!(await databaseExists(client, template))) {
        await client.query(`CREATE DATABASE "${template}" TEMPLATE template0`);
        await withDatabase(template, async (templateClient) => {
          await templateClient.query(schemaSql);
          await seedE2EData(templateClient);
          // This marker is written last: a failed initialization must never be accepted on the next call.
          await templateClient.query('CREATE TABLE _exodus_database_version (fingerprint text NOT NULL)');
          await templateClient.query('INSERT INTO _exodus_database_version VALUES ($1)', [fingerprint]);
        });
      }
      await checkVersion(template, fingerprint);
      if (!(await databaseExists(client, target))) {
        await client.query(`CREATE DATABASE "${target}" TEMPLATE "${template}"`);
      }
      await checkVersion(target, fingerprint);
    });
  });
}

/** Delete exodus-{name}; resetting template deletes every exodus- database while keeping the cluster running. */
export async function resetDatabase(name: string): Promise<void> {
  const target = name === 'template' ? template : databaseName(name);
  await withControlLock(async () => {
    await ensurePostgres();
    await withAdmin(async (client) => {
      const names: string[] =
        name === 'template'
          ? (
              await client.query(
                "SELECT datname FROM pg_database WHERE starts_with(datname, 'exodus-') ORDER BY datname",
              )
            ).rows.map((row) => row.datname)
          : [target];
      for (const database of names) {
        // Catalog names may contain quotes even though CLI-created names cannot.
        const identifier = database.replaceAll('"', '""');
        await client.query(`DROP DATABASE IF EXISTS "${identifier}" WITH (FORCE)`);
      }
    });
  });
}
