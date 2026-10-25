/** Development/test database provisioning. Failures leave state intact for explicit developer reset. */
import { createHash } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { Client } from 'pg';
import { seedE2EData } from './seed';
import { ensurePostgres, withControlLock } from './postgres';

const template = 'exodus-template';
const versionFile = new URL('../../../.direnv/pg_database_version', import.meta.url);
const temporaryVersionFile = new URL('../../../.direnv/pg_database_version.tmp', import.meta.url);

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

async function readVersions(): Promise<Record<string, string>> {
  let text: string;
  try {
    text = await readFile(versionFile, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
  const versions: unknown = JSON.parse(text);
  if (
    !versions ||
    typeof versions !== 'object' ||
    Array.isArray(versions) ||
    !Object.entries(versions).every(([name, value]) => name.startsWith('exodus-') && typeof value === 'string')
  ) {
    throw new Error('Invalid .direnv/pg_database_version; run pnpm pg:reset template.');
  }
  return versions as Record<string, string>;
}

async function writeVersions(versions: Record<string, string>): Promise<void> {
  // Rename under the control lock so interruption cannot leave a partially written record.
  await writeFile(temporaryVersionFile, JSON.stringify(versions, null, 2) + '\n');
  await rename(temporaryVersionFile, versionFile);
}

function checkVersion(name: string, fingerprint: string, versions: Record<string, string>): void {
  const resetName = name.slice('exodus-'.length);
  if (!versions[name]) {
    throw new Error(`${name} has no completed initialization record. Run pnpm pg:reset ${resetName}.`);
  }
  if (versions[name] !== fingerprint) {
    throw new Error(`${name} is outdated. Run pnpm pg:reset ${resetName}.`);
  }
}

/** Ensure the local server, seeded template and named clone exist; preserve existing data without changing connection environment variables. */
export async function ensureDatabase(name: string): Promise<void> {
  const target = databaseName(name);
  return withControlLock(async () => {
    await ensurePostgres();
    const schemaSql = await readFile(new URL('../../lib/server/repositories/database.sql', import.meta.url), 'utf8');
    const seedSource = await readFile(new URL('../../lib/testing/data.ts', import.meta.url));
    const fingerprint = createHash('sha256').update(schemaSql).update(seedSource).digest('hex');
    const versions = await readVersions();
    return withAdmin(async (client) => {
      if (!(await databaseExists(client, template))) {
        delete versions[template];
        await writeVersions(versions);
        await client.query(`CREATE DATABASE "${template}" TEMPLATE template0`);
        await withDatabase(template, async (templateClient) => {
          await templateClient.query(schemaSql);
          await seedE2EData(templateClient);
        });
        // Publish a version only after both schema and seed initialization have completed.
        versions[template] = fingerprint;
        await writeVersions(versions);
      }
      checkVersion(template, fingerprint, versions);
      if (!(await databaseExists(client, target))) {
        delete versions[target];
        await writeVersions(versions);
        await client.query(`CREATE DATABASE "${target}" TEMPLATE "${template}"`);
        versions[target] = fingerprint;
        await writeVersions(versions);
      }
      checkVersion(target, fingerprint, versions);
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
      const versions = name === 'template' ? {} : await readVersions();
      for (const database of names) {
        // Catalog names may contain quotes even though CLI-created names cannot.
        const identifier = database.replaceAll('"', '""');
        await client.query(`DROP DATABASE IF EXISTS "${identifier}" WITH (FORCE)`);
        delete versions[database];
      }
      if (name === 'template') {
        await rm(versionFile, { force: true });
        await rm(temporaryVersionFile, { force: true });
      } else {
        await writeVersions(versions);
      }
    });
  });
}
