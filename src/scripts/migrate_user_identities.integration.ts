import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { ensureDatabase, resetDatabase } from './lib/database';

const run = promisify(execFile);
const script = fileURLToPath(new URL('./migrate_user_identities.ts', import.meta.url));

test('migrate_user_identities copies GitHub IDs into identities once, however often it runs', async () => {
  const name = `migrate-identities-${process.pid}`;
  await resetDatabase(name);
  await ensureDatabase(name);
  const database = `exodus-${name}`;
  const client = new Client({ database });
  await client.connect();
  try {
    await client.query(`UPDATE "user" SET github_id = 1001 WHERE username = 'alice'`);
    await client.query(`UPDATE "user" SET github_id = 1002 WHERE username = 'bob'`);
    // An identity left by an earlier run, which a rerun must leave as it is.
    await client.query(
      `INSERT INTO user_identity (provider, subject, user_id, created_at)
       SELECT 'github', '1001', id, '2000-01-01' FROM "user" WHERE username = 'alice'`,
    );
    const env = {
      ...process.env,
      PGDATABASE: database,
      GITHUB_CLIENT_ID: 'id',
      GITHUB_CLIENT_SECRET: 'secret',
      APP_URL: 'http://localhost',
    };
    const rows = async () =>
      (
        await client.query(
          `SELECT i.provider, i.subject, u.username, i.created_at
           FROM user_identity i JOIN "user" u ON u.id = i.user_id ORDER BY i.subject`,
        )
      ).rows.map(({ provider, subject, username, created_at }) => ({
        provider,
        subject,
        username,
        created_at: new Date(created_at).toISOString(),
      }));

    const [earlier] = await rows();
    await run(process.execPath, ['--import', 'tsx', script], { env });
    const once = await rows();
    assert.deepEqual(
      once.map(({ provider, subject, username }) => ({ provider, subject, username })),
      [
        { provider: 'github', subject: '1001', username: 'alice' },
        { provider: 'github', subject: '1002', username: 'bob' },
      ],
    );
    assert.deepEqual(once[0], earlier);

    await run(process.execPath, ['--import', 'tsx', script], { env });
    assert.deepEqual(await rows(), once);
  } finally {
    await client.end();
    await resetDatabase(name);
  }
});
