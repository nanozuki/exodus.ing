import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from 'pg';
import { ensureDatabase, resetDatabase } from './lib/database';
import { getConfig } from '../lib/server/config';

test('database names reject reserved names, SQL fragments, and PostgreSQL truncation', async () => {
  for (const name of ['', 'all', 'template', 'dev"; DROP DATABASE postgres;', 'a'.repeat(57)]) {
    await assert.rejects(ensureDatabase(name));
  }
});

test('application configuration reads explicit environment values without local defaults', () => {
  const env = {
    APP_URL: 'https://example.test',
    GITHUB_CLIENT_ID: 'client-id',
    GITHUB_CLIENT_SECRET: 'client-secret',
    PGHOST: 'db.example.test',
    PGPORT: '5433',
    PGUSER: 'test-user',
    PGPASSWORD: 'p@ss:/?#',
    PGDATABASE: 'exodus-config-test',
  };
  const config = getConfig(env);
  assert.equal(config.appUrl, env.APP_URL);
  assert.equal(config.githubClientId, env.GITHUB_CLIENT_ID);
  assert.equal(config.githubClientSecret, env.GITHUB_CLIENT_SECRET);
  assert.deepEqual(config.database, {
    host: env.PGHOST,
    port: 5433,
    user: env.PGUSER,
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
  });
  const missingHost: NodeJS.ProcessEnv = { ...env };
  delete missingHost.PGHOST;
  assert.throws(() => getConfig(missingHost));
});

test('ensure clones seeded data, preserves changes, rejects outdated versions, and reset is scoped', async () => {
  const name = `check-${process.pid}`;
  const other = `${name}-other`;
  await ensureDatabase(name);
  const client = new Client({ database: `exodus-${name}` });
  await client.connect();
  try {
    assert.ok((await client.query('SELECT * FROM "user"')).rowCount! > 0);
    await client.query('CREATE TABLE ensure_sentinel (id integer)');
    await ensureDatabase(name);
    await ensureDatabase(other);
    await resetDatabase(other);
    assert.equal((await client.query("SELECT to_regclass('ensure_sentinel') AS name")).rows[0].name, 'ensure_sentinel');
    await client.query("UPDATE _exodus_database_version SET fingerprint = 'outdated'");
    await assert.rejects(ensureDatabase(name), /pg:reset/);
    await client.query('DROP TABLE _exodus_database_version');
    await assert.rejects(ensureDatabase(name), /pg:reset/);
  } finally {
    await client.end();
    await resetDatabase(name);
    await resetDatabase(other);
  }
  await resetDatabase(name);
});

test('independent processes can ensure the same database concurrently', async () => {
  const name = `parallel-${process.pid}`;
  const exec = promisify(execFile);
  const moduleUrl = new URL('./lib/database.ts', import.meta.url).href;
  const code = `const { ensureDatabase } = await import(${JSON.stringify(moduleUrl)}); await ensureDatabase(${JSON.stringify(name)}); console.log('ready');`;
  try {
    const results = await Promise.all([
      exec(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code]),
      exec(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code]),
    ]);
    assert.equal(results[0].stdout, 'ready\n');
    assert.equal(results[1].stdout, 'ready\n');
  } finally {
    await resetDatabase(name);
  }
});

// A separate cluster keeps the destructive template-reset regression test away from developers' databases.
test('template reset deletes all exodus databases, preserves unrelated databases, and allows recreation', async () => {
  const exec = promisify(execFile);
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

  // Keep the control socket below macOS's Unix socket path-length limit.
  const root = await mkdtemp('/tmp/exodus-pg-test-');
  const oldPort = process.env.PGPORT;
  let stop: (() => Promise<void>) | undefined;
  let client: Client | undefined;
  try {
    await mkdir(join(root, 'src/scripts'), { recursive: true });
    await cp(new URL('./lib/', import.meta.url), join(root, 'src/scripts/lib'), { recursive: true });
    await cp(new URL('../lib/', import.meta.url), join(root, 'src/lib'), { recursive: true });
    await cp(new URL('../../flake.lock', import.meta.url), join(root, 'flake.lock'));
    const flake = await readFile(new URL('../../flake.nix', import.meta.url), 'utf8');
    await writeFile(join(root, 'flake.nix'), flake.replace(/port = \d+;/, `port = ${port};`));
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    await symlink(fileURLToPath(new URL('../../node_modules', import.meta.url)), join(root, 'node_modules'));
    await exec('git', ['init', '-q', root]);
    await exec('git', ['-C', root, 'add', 'flake.nix', 'flake.lock']);
    process.env.PGPORT = String(port);
    const { ensureDatabase, resetDatabase } = await import(
      pathToFileURL(join(root, 'src/scripts/lib/database.ts')).href
    );
    const { stopPostgres, withControlLock } = await import(
      pathToFileURL(join(root, 'src/scripts/lib/postgres.ts')).href
    );
    stop = () => withControlLock(stopPostgres);
    await ensureDatabase('dev');
    await ensureDatabase('e2e');
    await ensureDatabase('case-1');
    client = new Client({ database: 'postgres' });
    await client.connect();
    await client.query('CREATE DATABASE "keep-me"');
    await client.query('CREATE DATABASE "exodus-quote""name"');
    await resetDatabase('template');
    const databases = (await client.query('SELECT datname FROM pg_database')).rows.map((row) => row.datname);
    assert.ok(databases.includes('keep-me'));
    assert.ok(databases.includes('postgres'));
    assert.equal(databases.filter((name: string) => name.startsWith('exodus-')).length, 0);
    await ensureDatabase('dev');
    assert.equal((await client.query("SELECT 1 FROM pg_database WHERE datname = 'exodus-dev'")).rowCount, 1);
    await assert.rejects(resetDatabase('all'));
  } finally {
    await client?.end();
    try {
      await stop?.();
      await rm(root, { recursive: true, force: true });
    } finally {
      if (oldPort === undefined) delete process.env.PGPORT;
      else process.env.PGPORT = oldPort;
    }
  }
});
