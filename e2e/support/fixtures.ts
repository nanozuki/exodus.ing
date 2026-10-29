import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { Client } from 'pg';
import { ensureDatabase, resetDatabase } from '../../src/scripts/lib/database';
import { testDataset } from '../../src/lib/testing/data';
import { databaseSuffix } from './names';

type Scenario = { prepare: (db: Client) => Promise<void> };
type Fixtures = {
  scenario: Scenario;
  db: Client;
  sessions: Map<string, string>;
  app: string;
  actor: (username: string) => Promise<Page>;
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

/** Each journey owns its clone, real sessions, deployment process and extra actor contexts. */
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
      const id = randomBytes(24).toString('hex');
      await db.query('INSERT INTO session (id, user_id, expires_at) VALUES ($1, $2, $3)', [
        id,
        user.id,
        new Date(Date.now() + 86_400_000),
      ]);
      sessions.set(user.username, id);
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
        ORIGIN: origin,
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
});

export { expect };
