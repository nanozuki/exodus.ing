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
import { getConfig } from '$lib/server/config';

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
    enableChannelBinding: false,
  });

  for (const mode of ['prefer', 'require', 'disable']) {
    const configured = getConfig({ ...env, PGCHANNELBINDING: mode });
    assert.equal(configured.database.enableChannelBinding, mode !== 'disable');
  }

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
    assert.equal((await client.query("SELECT to_regclass('_exodus_database_version') AS name")).rows[0].name, null);
    const versionFile = new URL('../../.direnv/pg_database_version', import.meta.url);
    const versions = JSON.parse(await readFile(versionFile, 'utf8'));
    assert.equal(versions[`exodus-${name}`], versions['exodus-template']);
    versions[`exodus-${name}`] = 'outdated';
    await writeFile(versionFile, JSON.stringify(versions));
    await assert.rejects(ensureDatabase(name), /pg:reset/);
    delete versions[`exodus-${name}`];
    await writeFile(versionFile, JSON.stringify(versions));
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
    await cp(new URL('../../drizzle.config.ts', import.meta.url), join(root, 'drizzle.config.ts'));
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
    assert.equal((await client.query('SELECT current_user')).rows[0].current_user, 'exodus');
    const push = await exec('pnpm', ['exec', 'drizzle-kit', 'push', '--force'], {
      cwd: root,
      env: { ...process.env, PGDATABASE: 'exodus-dev' },
      timeout: 120_000,
    });
    assert.match(push.stdout, /No changes detected/);
    await ensureDatabase('dev');
    const wrongPassword = new Client({ database: 'postgres', password: 'wrong-password' });
    try {
      await assert.rejects(wrongPassword.connect(), { code: '28P01' });
    } finally {
      await wrongPassword.end();
    }
    const versionFile = join(root, '.direnv/pg_database_version');
    const databaseScript = join(root, 'src/scripts/lib/database.ts');
    await writeFile(databaseScript, (await readFile(databaseScript, 'utf8')) + '\n// unrelated comment\n');
    await ensureDatabase('dev');
    for (const file of ['src/lib/server/db/database.sql', 'src/lib/testing/data.ts']) {
      const path = join(root, file);
      const original = await readFile(path);
      try {
        await writeFile(
          path,
          Buffer.concat([
            original,
            Buffer.from(file.endsWith('.sql') ? '\n-- checksum change\n' : '\n// checksum change\n'),
          ]),
        );
        await assert.rejects(ensureDatabase('dev'), /pg:reset template/);
      } finally {
        await writeFile(path, original);
      }
    }
    await client.query('CREATE DATABASE "keep-me"');
    await client.query('CREATE DATABASE "exodus-quote""name"');
    await resetDatabase('template');
    await assert.rejects(readFile(versionFile), { code: 'ENOENT' });
    const databases = (await client.query('SELECT datname FROM pg_database')).rows.map((row) => row.datname);
    assert.ok(databases.includes('keep-me'));
    assert.ok(databases.includes('postgres'));
    assert.equal(databases.filter((name: string) => name.startsWith('exodus-')).length, 0);
    const sqlPath = join(root, 'src/lib/server/db/database.sql');
    const originalSql = await readFile(sqlPath);
    try {
      await writeFile(sqlPath, Buffer.concat([originalSql, Buffer.from('\nINVALID SQL;\n')]));
      await assert.rejects(ensureDatabase('broken'));
    } finally {
      await writeFile(sqlPath, originalSql);
    }
    await assert.rejects(ensureDatabase('broken'), /no completed initialization record/);
    await resetDatabase('template');
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
