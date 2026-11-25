import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { PreAuthPurpose, type PreAuthSession } from '#lib/models/session.js';
import { tPreAuthSession } from '#lib/server/db/schema.js';
import { createPreAuthSession, deletePreAuthSession, findPreAuthSessionById } from './pre_auth_session';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-pre-auth');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

const expiresAt = new Date('2026-06-01T00:10:00Z');
// A creation time before every session these tests store, so creating one clears nothing.
const early = new Date('2000-01-01T00:00:00Z');

function signUpSession(id: string, expiry = expiresAt): PreAuthSession<PreAuthPurpose.SignUp> {
  return {
    id,
    purpose: PreAuthPurpose.SignUp,
    secretHash: `${id}-hash`,
    payload: { identity: { provider: 'github', subject: '42' }, hints: { username: 'octo' }, next: '/console' },
    expiresAt: expiry,
  };
}

describe('createPreAuthSession', () => {
  it('stores the session as given and returns it', async () => {
    const session = signUpSession('created');
    expect(await createPreAuthSession(database.db, session, early)).toEqual(session);
    expect(await findPreAuthSessionById(database.db, 'created', PreAuthPurpose.SignUp)).toEqual(session);
  });

  it('deletes sessions of every purpose expired at or before now and keeps later ones', async () => {
    const db = database.db;
    const now = new Date('2030-01-01T00:00:00Z');
    await db
      .insert(tPreAuthSession)
      .values([
        signUpSession('sweep-before', new Date(+now - 1)),
        signUpSession('sweep-at', now),
        { ...signUpSession('sweep-other-purpose', new Date(+now - 1)), purpose: 'link' as PreAuthPurpose },
        signUpSession('sweep-after', new Date(+now + 1)),
      ]);
    await createPreAuthSession(db, signUpSession('sweep-new', new Date(+now + 600_000)), now);
    const ids = (await db.select({ id: tPreAuthSession.id }).from(tPreAuthSession)).map((row) => row.id);
    expect(ids.filter((id) => id.startsWith('sweep-')).sort()).toEqual(['sweep-after', 'sweep-new']);
  });
});

describe('findPreAuthSessionById', () => {
  it('returns null for an unknown ID', async () => {
    expect(await findPreAuthSessionById(database.db, 'absent', PreAuthPurpose.SignUp)).toBeNull();
  });

  it('returns null for a session of another purpose', async () => {
    await database.db.insert(tPreAuthSession).values({
      ...signUpSession('other-purpose'),
      purpose: 'link' as PreAuthPurpose,
    });
    expect(await findPreAuthSessionById(database.db, 'other-purpose', PreAuthPurpose.SignUp)).toBeNull();
  });

  it('throws DATABASE_ERROR for a payload that fails its purpose schema', async () => {
    await database.db.insert(tPreAuthSession).values({ ...signUpSession('corrupted'), payload: { identity: 42 } });
    await expect(findPreAuthSessionById(database.db, 'corrupted', PreAuthPurpose.SignUp)).rejects.toMatchObject({
      body: { detail: { tag: 'DATABASE_ERROR', value: { operation: 'findPreAuthSessionById' } } },
    });
  });
});

describe('deletePreAuthSession', () => {
  it('deletes the session', async () => {
    await createPreAuthSession(database.db, signUpSession('deleted'), early);
    await deletePreAuthSession(database.db, 'deleted');
    expect(await findPreAuthSessionById(database.db, 'deleted', PreAuthPurpose.SignUp)).toBeNull();
  });

  it('does nothing for an unknown ID', async () => {
    await expect(deletePreAuthSession(database.db, 'absent')).resolves.toBeUndefined();
  });
});
