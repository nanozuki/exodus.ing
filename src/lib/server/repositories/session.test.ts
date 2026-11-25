import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import type { Session } from '#lib/models/session.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { tSession } from '#lib/server/db/schema.js';
import { createSession, deleteSession, findSessionById, updateSession } from './session';

let database: TestDatabase;
let userId: string;
let otherUserId: string;

beforeAll(async () => {
  database = await createTestDatabase('repository-session');
  userId = (await findUserByUsername(database.db, 'alice'))!.id;
  otherUserId = (await findUserByUsername(database.db, 'bob'))!.id;
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

const now = new Date('2030-01-01T00:00:00Z');

function session(id: string, expiresAt: Date, owner = userId): Session {
  return { id, userId: owner, secretHash: `${id}-hash`, expiresAt };
}

describe('createSession', () => {
  it('stores the session as given and returns it', async () => {
    const created = session('created', new Date(+now + 1));
    expect(await createSession(database.db, created, now)).toEqual(created);
    expect(await findSessionById(database.db, 'created')).toEqual(created);
  });

  it("deletes every user's sessions expired at or before now and keeps later ones", async () => {
    const db = database.db;
    await db
      .insert(tSession)
      .values([
        session('sweep-before', new Date(+now - 1)),
        session('sweep-at', now),
        session('sweep-other-user', new Date(+now - 1), otherUserId),
        session('sweep-after', new Date(+now + 1)),
      ]);
    await createSession(db, session('sweep-new', new Date(+now + 1)), now);
    const ids = (await db.select({ id: tSession.id }).from(tSession)).map((row) => row.id);
    expect(ids.filter((id) => id.startsWith('sweep-')).sort()).toEqual(['sweep-after', 'sweep-new']);
  });
});

describe('findSessionById', () => {
  it('returns null for an unknown ID', async () => {
    expect(await findSessionById(database.db, 'absent')).toBeNull();
  });
});

describe('updateSession', () => {
  it("sets the session's expiration", async () => {
    await createSession(database.db, session('updated', new Date(+now + 1)), now);
    const expiresAt = new Date(+now + 86_400_000);
    await updateSession(database.db, { id: 'updated', expiresAt });
    expect(await findSessionById(database.db, 'updated')).toMatchObject({ expiresAt });
  });

  it('does nothing for an unknown ID', async () => {
    await expect(updateSession(database.db, { id: 'absent', expiresAt: now })).resolves.toBeUndefined();
  });
});

describe('deleteSession', () => {
  it('deletes the session', async () => {
    await createSession(database.db, session('deleted', new Date(+now + 1)), now);
    await deleteSession(database.db, 'deleted');
    expect(await findSessionById(database.db, 'deleted')).toBeNull();
  });

  it('does nothing for an unknown ID', async () => {
    await expect(deleteSession(database.db, 'absent')).resolves.toBeUndefined();
  });
});
