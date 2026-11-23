import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { hashSessionSecret } from '#lib/models/session.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { findSessionById, createSession as persistSession } from '#lib/server/repositories/session.js';
import { createSession, invalidateSession, validateSession } from './session';

let database: TestDatabase;
let userId: string;

beforeAll(async () => {
  database = await createTestDatabase('use-case-session');
  userId = (await findUserByUsername(database.db, 'alice'))!.id;
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

const instant = new Date('2026-06-01T00:00:00Z');
const day = 86400000;

// Persist a session whose token is known, bypassing createSession so tests control the stored record.
async function persistKnownSession(id: string, expiresAt: Date, secret = `${id}-secret`): Promise<string> {
  await persistSession(database.db, { id, userId, secretHash: hashSessionSecret(secret), expiresAt });
  return `${id}.${secret}`;
}

function injectedRandom(id: string) {
  return { sessionId: vi.fn(() => id), sessionSecret: vi.fn(() => `${id}-secret`) };
}

describe('createSession', () => {
  it('returns a token of the session ID and secret and stores only the secret hash', async () => {
    const random = injectedRandom('created');
    const { session, token } = await createSession({ db: database.db, now: () => instant, random }, { userId });
    expect(token).toBe('created.created-secret');
    expect(session).toEqual({
      id: 'created',
      userId,
      secretHash: hashSessionSecret('created-secret'),
      expiresAt: new Date(+instant + 30 * day),
    });
    expect(await findSessionById(database.db, session.id)).toEqual(session);
  });

  it('reads the clock and each generator once', async () => {
    const now = vi.fn(() => instant);
    const random = injectedRandom('read-once');
    await createSession({ db: database.db, now, random }, { userId });
    expect(now).toHaveBeenCalledTimes(1);
    expect(random.sessionId).toHaveBeenCalledTimes(1);
    expect(random.sessionSecret).toHaveBeenCalledTimes(1);
  });

  it('returns a token that validates', async () => {
    const deps = { db: database.db, now: () => instant, random: injectedRandom('validates') };
    const { token } = await createSession(deps, { userId });
    expect(await validateSession(deps, { token })).not.toBeNull();
  });
});

describe('validateSession', () => {
  it('returns null for tokens assembled from stored columns', async () => {
    const id = 'stored-columns';
    await persistKnownSession(id, new Date(+instant + 30 * day));
    const stored = (await findSessionById(database.db, id))!;
    const deps = { db: database.db, now: () => instant };
    for (const token of [stored.id, `${stored.id}.${stored.secretHash}`, `${stored.id}.${stored.userId}`]) {
      expect(await validateSession(deps, { token })).toBeNull();
    }
  });

  it.each([
    [-1, null],
    [0, null],
    [1, true],
    [20 * day, true],
    [20 * day + 1, false],
  ])('handles the expiry and renewal boundary at %i ms remaining', async (remaining, refresh) => {
    const id = `boundary-${remaining}`;
    const token = await persistKnownSession(id, new Date(+instant + remaining));
    const now = vi.fn(() => instant);
    const result = await validateSession({ db: database.db, now }, { token });
    expect(now).toHaveBeenCalledTimes(1);
    if (refresh === null) {
      expect(result).toBeNull();
      expect(await findSessionById(database.db, id)).toBeNull();
    } else {
      expect(result?.refresh).toBe(refresh);
      expect(result?.session).toEqual(await findSessionById(database.db, id));
      expect(result?.session.expiresAt).toEqual(new Date(+instant + (refresh ? 30 * day : remaining)));
    }
  });

  it.each(['', 'missing.secret', 'no-separator', '.secret', 'id.', 'a.b.c'])(
    'returns null for the malformed or unknown token %j',
    async (token) => {
      expect(await validateSession({ db: database.db, now: () => instant }, { token })).toBeNull();
    },
  );

  it('returns null for a wrong secret and leaves the expired session stored', async () => {
    const expiresAt = new Date(+instant - 1);
    await persistKnownSession('validate-mismatch', expiresAt);
    const deps = { db: database.db, now: () => instant };
    expect(await validateSession(deps, { token: 'validate-mismatch.wrong-secret' })).toBeNull();
    expect(await findSessionById(database.db, 'validate-mismatch')).toMatchObject({ expiresAt });
  });

  it('treats a corrupted stored hash as a wrong secret', async () => {
    await persistSession(database.db, {
      id: 'corrupted',
      userId,
      secretHash: 'not-hex',
      expiresAt: new Date(+instant + 30 * day),
    });
    expect(await validateSession({ db: database.db, now: () => instant }, { token: 'corrupted.secret' })).toBeNull();
  });
});

describe('invalidateSession', () => {
  it('deletes the session so its token validates as null', async () => {
    const token = await persistKnownSession('signed-out', new Date(+instant + 30 * day));
    const deps = { db: database.db, now: () => instant };
    await invalidateSession(deps, { token });
    expect(await findSessionById(database.db, 'signed-out')).toBeNull();
    expect(await validateSession(deps, { token })).toBeNull();
  });

  it('deletes an expired session its token names', async () => {
    const token = await persistKnownSession('expired-signed-out', new Date(+instant - 1));
    await invalidateSession({ db: database.db }, { token });
    expect(await findSessionById(database.db, 'expired-signed-out')).toBeNull();
  });

  it('leaves the session stored for a wrong secret', async () => {
    const expiresAt = new Date(+instant - 1);
    await persistKnownSession('invalidate-mismatch', expiresAt);
    await invalidateSession({ db: database.db }, { token: 'invalidate-mismatch.wrong-secret' });
    expect(await findSessionById(database.db, 'invalidate-mismatch')).toMatchObject({ expiresAt });
  });

  it('ignores a malformed token', async () => {
    await expect(invalidateSession({ db: database.db }, { token: 'no-separator' })).resolves.toBeUndefined();
  });
});
