import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { hashSessionSecret, PreAuthPurpose } from '#lib/models/session.js';
import { tPreAuthSession } from '#lib/server/db/schema.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { findSessionById, createSession as persistSession } from '#lib/server/repositories/session.js';
import { findPreAuthSessionById } from '#lib/server/repositories/pre_auth_session.js';
import {
  createPreAuthSession,
  createSession,
  invalidateSession,
  validatePreAuthSession,
  validateSession,
} from './session';

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

// A creation time before every session these tests store, so persisting one clears nothing.
const early = new Date('2000-01-01T00:00:00Z');

// Persist a session whose token is known, bypassing createSession so tests control the stored record.
async function persistKnownSession(id: string, expiresAt: Date, secret = `${id}-secret`): Promise<string> {
  await persistSession(database.db, { id, userId, secretHash: hashSessionSecret(secret), expiresAt }, early);
  return `${id}.${secret}`;
}

function injectedRandom(id: string) {
  return { sessionId: vi.fn(() => id), sessionSecret: vi.fn(() => `${id}-secret`) };
}

describe('createSession', () => {
  it('returns a token of the session ID and secret and stores only the secret hash', async () => {
    const random = injectedRandom('created');
    const { session, token } = await createSession(
      { db: database.db, clock: { now: () => instant }, random },
      { userId },
    );
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
    await createSession({ db: database.db, clock: { now }, random }, { userId });
    expect(now).toHaveBeenCalledTimes(1);
    expect(random.sessionId).toHaveBeenCalledTimes(1);
    expect(random.sessionSecret).toHaveBeenCalledTimes(1);
  });

  it('returns a token that validates', async () => {
    const deps = { db: database.db, clock: { now: () => instant }, random: injectedRandom('validates') };
    const { token } = await createSession(deps, { userId });
    expect(await validateSession(deps, { token })).not.toBeNull();
  });

  it('deletes sessions already expired at now', async () => {
    const at = new Date(+instant + 1000 * day);
    await persistKnownSession('swept', at);
    await persistKnownSession('kept', new Date(+at + 1));
    await createSession({ db: database.db, clock: { now: () => at }, random: injectedRandom('sweeper') }, { userId });
    expect(await findSessionById(database.db, 'swept')).toBeNull();
    expect(await findSessionById(database.db, 'kept')).not.toBeNull();
  });
});

describe('validateSession', () => {
  it('returns null for tokens assembled from stored columns', async () => {
    const id = 'stored-columns';
    await persistKnownSession(id, new Date(+instant + 30 * day));
    const stored = (await findSessionById(database.db, id))!;
    const deps = { db: database.db, clock: { now: () => instant } };
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
    const result = await validateSession({ db: database.db, clock: { now } }, { token });
    expect(now).toHaveBeenCalledTimes(1);
    if (refresh === null) {
      expect(result).toBeNull();
      expect(await findSessionById(database.db, id)).toMatchObject({ expiresAt: new Date(+instant + remaining) });
    } else {
      expect(result?.refresh).toBe(refresh);
      expect(result?.session).toEqual(await findSessionById(database.db, id));
      expect(result?.session.expiresAt).toEqual(new Date(+instant + (refresh ? 30 * day : remaining)));
    }
  });

  it.each(['', 'missing.secret', 'no-separator', '.secret', 'id.', 'a.b.c'])(
    'returns null for the malformed or unknown token %j',
    async (token) => {
      expect(await validateSession({ db: database.db, clock: { now: () => instant } }, { token })).toBeNull();
    },
  );

  it('returns null for a wrong secret and leaves the expired session stored', async () => {
    const expiresAt = new Date(+instant - 1);
    await persistKnownSession('validate-mismatch', expiresAt);
    const deps = { db: database.db, clock: { now: () => instant } };
    expect(await validateSession(deps, { token: 'validate-mismatch.wrong-secret' })).toBeNull();
    expect(await findSessionById(database.db, 'validate-mismatch')).toMatchObject({ expiresAt });
  });

  it('treats a corrupted stored hash as a wrong secret', async () => {
    await persistSession(
      database.db,
      { id: 'corrupted', userId, secretHash: 'not-hex', expiresAt: new Date(+instant + 30 * day) },
      early,
    );
    expect(
      await validateSession({ db: database.db, clock: { now: () => instant } }, { token: 'corrupted.secret' }),
    ).toBeNull();
  });
});

describe('invalidateSession', () => {
  it('deletes the session so its token validates as null', async () => {
    const token = await persistKnownSession('signed-out', new Date(+instant + 30 * day));
    const deps = { db: database.db, clock: { now: () => instant } };
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

const signUpPayload = { identity: { provider: 'github' as const, subject: '42' }, hints: { username: 'octo' } };

async function createSignUp(id: string, at = instant) {
  const deps = { db: database.db, clock: { now: () => at }, random: injectedRandom(id) };
  return createPreAuthSession(deps, { purpose: PreAuthPurpose.SignUp, payload: signUpPayload });
}

describe('createPreAuthSession', () => {
  it('deletes pre-auth sessions already expired at now', async () => {
    const at = new Date(+instant + 1000 * day);
    await database.db.insert(tPreAuthSession).values(
      ['pre-swept', 'pre-kept'].map((id, i) => ({
        id,
        purpose: PreAuthPurpose.SignUp,
        secretHash: hashSessionSecret(`${id}-secret`),
        payload: signUpPayload,
        expiresAt: new Date(+at + i),
      })),
    );
    await createSignUp('pre-sweeper', at);
    expect(await findPreAuthSessionById(database.db, 'pre-swept', PreAuthPurpose.SignUp)).toBeNull();
    expect(await findPreAuthSessionById(database.db, 'pre-kept', PreAuthPurpose.SignUp)).not.toBeNull();
  });

  it('stores only the secret hash and the payload, expiring 10 minutes after now', async () => {
    const { session, token } = await createSignUp('pre-created');
    expect(token).toBe('pre-created.pre-created-secret');
    expect(session).toEqual({
      id: 'pre-created',
      purpose: PreAuthPurpose.SignUp,
      secretHash: hashSessionSecret('pre-created-secret'),
      payload: signUpPayload,
      expiresAt: new Date(+instant + 10 * 60000),
    });
    expect(await findPreAuthSessionById(database.db, 'pre-created', PreAuthPurpose.SignUp)).toEqual(session);
  });
});

describe('validatePreAuthSession', () => {
  const validate = (token: string, at = instant) =>
    validatePreAuthSession({ db: database.db, clock: { now: () => at } }, { token, purpose: PreAuthPurpose.SignUp });

  it('returns the session repeatedly without consuming or extending it', async () => {
    const { session, token } = await createSignUp('pre-valid');
    const later = new Date(+instant + 9 * 60000);
    expect(await validate(token, later)).toEqual(session);
    expect(await validate(token, later)).toEqual(session);
  });

  it.each(['pre-malformed', 'pre-malformed.', '.secret', 'a.b.c', 'pre-unknown.secret'])(
    'returns null for the token %j',
    async (token) => {
      expect(await validate(token)).toBeNull();
    },
  );

  it('returns null for a wrong secret and leaves the session stored', async () => {
    const { session } = await createSignUp('pre-wrong');
    expect(await validate('pre-wrong.other-secret')).toBeNull();
    expect(await findPreAuthSessionById(database.db, 'pre-wrong', PreAuthPurpose.SignUp)).toEqual(session);
  });

  it('returns null for a session of another purpose', async () => {
    await database.db.insert(tPreAuthSession).values({
      id: 'pre-other',
      purpose: 'link' as PreAuthPurpose,
      secretHash: hashSessionSecret('pre-other-secret'),
      payload: {},
      expiresAt: new Date(+instant + 60000),
    });
    expect(await validate('pre-other.pre-other-secret')).toBeNull();
  });

  it('throws DATABASE_ERROR for a stored payload that fails its schema', async () => {
    await database.db.insert(tPreAuthSession).values({
      id: 'pre-corrupt',
      purpose: PreAuthPurpose.SignUp,
      secretHash: hashSessionSecret('pre-corrupt-secret'),
      payload: { identity: 42 },
      expiresAt: new Date(+instant + 60000),
    });
    await expect(validate('pre-corrupt.pre-corrupt-secret')).rejects.toMatchObject({
      body: { detail: { tag: 'DATABASE_ERROR' } },
    });
  });

  it('returns null at the expiry and leaves the session stored', async () => {
    const { session, token } = await createSignUp('pre-expired');
    expect(await validate(token, session.expiresAt)).toBeNull();
    expect(await findPreAuthSessionById(database.db, 'pre-expired', PreAuthPurpose.SignUp)).toEqual(session);
  });
});
