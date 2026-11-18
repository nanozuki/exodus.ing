import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { asc } from 'drizzle-orm';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tUser, tUserIdentity } from '#lib/server/db/schema.js';

const state = vi.hoisted(() => ({ database: undefined as TestDatabase | undefined }));

vi.mock('#lib/server/config.js', () => ({ getConfig: () => ({}) }));
vi.mock('#lib/server/db/index.js', () => ({ getDatabase: async () => state.database!.db }));

beforeAll(async () => {
  state.database = await createTestDatabase('migrate-identities');
}, 120_000);

afterAll(async () => {
  await state.database?.close();
}, 120_000);

it('copies legacy GitHub IDs into identities idempotently', async () => {
  const db = state.database!.db;
  const before = await db.select().from(tUserIdentity).orderBy(asc(tUserIdentity.subject));
  await db.insert(tUser).values([
    { id: 'legacy', username: 'legacy', name: 'Legacy', aboutMe: '', verifyCode: 'v', githubId: 777 },
    { id: 'nogh', username: 'nogh', name: 'No GitHub', aboutMe: '', verifyCode: 'v' },
  ]);

  // Importing the script runs the migration once.
  const { migrateUserIdentities } = await import('./migrate_user_identities');
  const once = await db.select().from(tUserIdentity).orderBy(asc(tUserIdentity.subject));
  await migrateUserIdentities();
  const twice = await db.select().from(tUserIdentity).orderBy(asc(tUserIdentity.subject));

  expect(once).toEqual(
    [...before, { userId: 'legacy', provider: 'github', subject: '777', createdAt: expect.any(Date) }].sort((a, b) =>
      a.subject.localeCompare(b.subject),
    ),
  );
  expect(twice).toEqual(once);
});
