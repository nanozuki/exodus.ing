import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { Client } from 'pg';
import { ensureDatabase, resetDatabase } from '../../src/scripts/lib/database';
import { testDataset } from '#lib/testing/data.js';
import { databaseSuffix } from './names';

type Scenario = { prepare: (db: Client) => Promise<void> };
type PendingSignUp = { subject: string; username?: string; name?: string; next?: string };
type Fixtures = {
  scenario: Scenario;
  db: Client;
  sessions: Map<string, string>;
  app: string;
  actor: (username: string) => Promise<Page>;
  pendingSignUp: (signUp: PendingSignUp) => Promise<Page>;
};

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No application port was assigned');
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return address.port;
}

/**
 * Playwright `test` whose journeys each own a database clone, real sessions, a deployment process, and actor contexts.
 * Each test resets and clones the database that `databaseSuffix` derives from its title, runs `scenario.prepare` on it,
 * stores a real session for every test-dataset user, and starts `build/index.js` in production mode on its own port
 * with a matching `APP_URL`, waiting up to 20 seconds for readiness. The adapter derives the local HTTP origin from
 * `PROTOCOL_HEADER`, so requests must send `x-forwarded-proto: http`: the `extraHTTPHeaders` fixture does, and custom
 * browser contexts must inherit it. `actor(username)` opens a page in a separate browser context carrying that user's
 * session cookie. `pendingSignUp` stores a pending sign-up for the GitHub identity `subject`, with the given hints and
 * `next`, expiring in ten minutes, and opens a page in a separate context carrying its `sign_up_session` cookie, as the
 * OAuth callback leaves a new identity. Teardown follows dependency order: contexts close, the application stops
 * (SIGTERM, then SIGKILL after five seconds), then the database connection closes and a passed test's database is
 * deleted. A failed test keeps its database and attaches its name and the application log.
 */
export const test = base.extend<Fixtures>({
  scenario: [{ prepare: async () => {} }, { option: true }],
  db: async ({ scenario }, use, info) => {
    const suffix = databaseSuffix(info.title);
    const database = `exodus-${suffix}`;
    info.annotations.push({ type: 'database', description: database });
    const db = new Client({ database, connectionTimeoutMillis: 5000 });
    try {
      await resetDatabase(suffix);
      await ensureDatabase(suffix);
      await db.connect();
      await scenario.prepare(db);
      await use(db);
    } finally {
      await db.end();
      if (info.status === 'passed') {
        await resetDatabase(suffix);
      } else {
        console.error(`Preserved E2E database: ${database}`);
        await info.attach('database', { body: database, contentType: 'text/plain' });
      }
    }
  },
  sessions: async ({ db }, use) => {
    const sessions = new Map<string, string>();
    for (const user of testDataset.users) {
      // Mirror the application's `<id>.<secret>` token and stored SHA-256 secret hash.
      const id = randomBytes(24).toString('hex');
      const secret = randomBytes(32).toString('base64url');
      await db.query('INSERT INTO session (id, user_id, secret_hash, expires_at) VALUES ($1, $2, $3, $4)', [
        id,
        user.id,
        createHash('sha256').update(secret).digest('hex'),
        new Date(Date.now() + 86_400_000),
      ]);
      sessions.set(user.username, `${id}.${secret}`);
    }
    await use(sessions);
  },
  app: async ({ db, sessions }, use, info) => {
    void db;
    void sessions;
    const port = await availablePort();
    const origin = `http://localhost:${port}`;
    const app = spawn(process.execPath, ['build/index.js'], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: String(port),
        SHUTDOWN_TIMEOUT: '1',
        PROTOCOL_HEADER: 'x-forwarded-proto',
        APP_URL: origin,
        PGDATABASE: `exodus-${databaseSuffix(info.title)}`,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? 'e2e-client',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? 'e2e-secret',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let logs = '';
    let startupError: Error | undefined;
    app.on('error', (error) => {
      startupError = error;
    });
    app.stdout.on('data', (data) => {
      logs += data.toString();
    });
    app.stderr.on('data', (data) => {
      logs += data.toString();
    });
    const exited = new Promise<void>((resolve) => app.once('close', () => resolve()));
    try {
      const deadline = Date.now() + 20_000;
      for (;;) {
        if (startupError) throw startupError;
        if (app.exitCode !== null || app.signalCode !== null)
          throw new Error(`Application exited during startup:\n${logs}`);
        try {
          const response = await fetch(origin, {
            headers: { 'x-forwarded-proto': 'http' },
            signal: AbortSignal.timeout(1000),
          });
          if (response.ok) break;
        } catch {
          /* The deployment server may not have bound its socket yet. */
        }
        if (Date.now() >= deadline) throw new Error(`Application readiness timed out:\n${logs}`);
        await delay(100);
      }
      await use(origin);
    } finally {
      app.kill('SIGTERM');
      const killTimer = setTimeout(() => app.kill('SIGKILL'), 5000);
      await exited;
      clearTimeout(killTimer);
      if (info.status !== 'passed') await info.attach('application.log', { body: logs, contentType: 'text/plain' });
    }
  },
  baseURL: async ({ app }, use) => {
    await use(app);
  },
  extraHTTPHeaders: { 'x-forwarded-proto': 'http' },
  actor: async ({ browser, app, sessions }, use) => {
    const contexts: BrowserContext[] = [];
    try {
      await use(async (username) => {
        const session = sessions.get(username);
        if (!session) throw new Error(`No prepared session for ${username}`);
        const context = await browser.newContext({ baseURL: app, extraHTTPHeaders: { 'x-forwarded-proto': 'http' } });
        contexts.push(context);
        await context.addCookies([{ name: 'auth_session', value: session, url: app, httpOnly: true, sameSite: 'Lax' }]);
        return context.newPage();
      });
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  },
  pendingSignUp: async ({ browser, app, db }, use) => {
    const contexts: BrowserContext[] = [];
    try {
      await use(async ({ subject, username, name, next }) => {
        // Mirror the application's `<id>.<secret>` token and its `sign_up` payload.
        const id = randomBytes(24).toString('hex');
        const secret = randomBytes(32).toString('base64url');
        const payload = { identity: { provider: 'github', subject }, hints: { username, name }, next };
        await db.query(
          'INSERT INTO pre_auth_session (id, secret_hash, purpose, payload, expires_at) VALUES ($1, $2, $3, $4, $5)',
          [id, createHash('sha256').update(secret).digest('hex'), 'sign_up', payload, new Date(Date.now() + 600_000)],
        );
        const context = await browser.newContext({ baseURL: app, extraHTTPHeaders: { 'x-forwarded-proto': 'http' } });
        contexts.push(context);
        await context.addCookies([
          { name: 'sign_up_session', value: `${id}.${secret}`, url: app, httpOnly: true, sameSite: 'Lax' },
        ]);
        return context.newPage();
      });
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  },
});

export { expect };
