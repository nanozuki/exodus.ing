import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tUser, tUserIdentity } from '#lib/server/db/schema.js';

const state = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock('#lib/server/config.js', () => ({ getConfig: () => ({}) }));
vi.mock('#lib/server/db/index.js', () => ({ getDatabase: async () => state.db }));

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('migrate-user-identities');
  state.db = database.db;
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

// Importing the script runs the migration once; a fresh module graph lets it run again.
async function runMigration() {
  vi.resetModules();
  await import('./migrate_user_identities');
}

async function identities() {
  return database.db
    .select({ subject: tUserIdentity.subject, username: tUser.username, createdAt: tUserIdentity.createdAt })
    .from(tUserIdentity)
    .innerJoin(tUser, eq(tUser.id, tUserIdentity.userId))
    .where(eq(tUserIdentity.provider, 'github'))
    .orderBy(tUserIdentity.subject);
}

describe('migrateUserIdentities', () => {
  it('copies each GitHub ID into an identity once, leaving existing identities as they are', async () => {
    const db = database.db;
    await db.update(tUser).set({ githubId: 1001 }).where(eq(tUser.username, 'alice'));
    await db.update(tUser).set({ githubId: 1002 }).where(eq(tUser.username, 'bob'));
    // An identity left by an earlier run, which the migration must leave as it is.
    const earlier = new Date('2000-01-01T00:00:00Z');
    const [alice] = await db.select({ id: tUser.id }).from(tUser).where(eq(tUser.username, 'alice'));
    await db
      .insert(tUserIdentity)
      .values({ provider: 'github', subject: '1001', userId: alice.id, createdAt: earlier });

    await runMigration();
    const once = await identities();
    expect(once.map(({ subject, username }) => ({ subject, username }))).toEqual([
      { subject: '1001', username: 'alice' },
      { subject: '1002', username: 'bob' },
    ]);
    expect(once[0].createdAt).toEqual(earlier);

    await runMigration();
    expect(await identities()).toEqual(once);
  });
});
