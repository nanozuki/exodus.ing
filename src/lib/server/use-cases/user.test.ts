import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { Role } from '#lib/models/role.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { hashSessionSecret, PreAuthPurpose } from '#lib/models/session.js';
import { tPreAuthSession } from '#lib/server/db/schema.js';
import { createUser, findUserByIdentity, findUserByUsername } from '#lib/server/repositories/user.js';
import { findPreAuthSessionById } from '#lib/server/repositories/pre_auth_session.js';
import { findSessionById } from '#lib/server/repositories/session.js';
import { cancelSignUp, completeSignUp, fetchSignUpPrefill, signInWithIdentity, updateUsername } from './user';

let database: TestDatabase;
let author: LoggedInUser;

beforeAll(async () => {
  database = await createTestDatabase('use-case-user');
  author = { ...(await findUserByUsername(database.db, 'alice'))!, roles: [Role.ArticleAuthor] };
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

const instant = new Date('2026-06-01T00:00:00Z');

function deps(sessionId: string, at = instant) {
  return {
    db: database.db,
    now: () => at,
    random: { sessionId: () => sessionId, sessionSecret: () => `${sessionId}-secret` },
  };
}

describe('updateUsername', () => {
  it("accepts the actor's current username as a no-op", async () => {
    await expect(
      updateUsername({ db: database.db }, { actor: author, username: author.username }),
    ).resolves.toBeUndefined();
  });
});

function github(subject: string) {
  return { provider: 'github' as const, subject };
}

// Starts a pending sign-up for a new GitHub identity and returns its token.
async function startSignUp(subject: string, hints: { username?: string; name?: string } = {}, next?: string) {
  const result = await signInWithIdentity(deps(`pending-${subject}`), { identity: github(subject), hints, next });
  if (result.status !== 'sign_up_required') throw new Error('expected a pending sign-up');
  return result.token;
}

describe('signInWithIdentity', () => {
  it('signs a known identity in to its user without changing the user', async () => {
    const user = await createUser(database.db, {
      username: 'known-identity',
      name: 'Known Identity',
      aboutMe: 'bio',
      identity: github('100'),
    });
    const result = await signInWithIdentity(deps('known'), {
      identity: github('100'),
      hints: { username: 'renamed', name: 'Renamed' },
    });
    expect(result).toMatchObject({ status: 'signed_in', token: 'known.known-secret', session: { userId: user.id } });
    expect(await findSessionById(database.db, 'known')).not.toBeNull();
    expect(await findUserByIdentity(database.db, github('100'))).toEqual(user);
  });

  it('starts a pending sign-up for an unknown identity without creating a user', async () => {
    const identity = github('101');
    const result = await signInWithIdentity(deps('unknown'), {
      identity,
      hints: { username: 'newcomer' },
      next: '//evil.example',
    });
    expect(result).toMatchObject({
      status: 'sign_up_required',
      token: 'unknown.unknown-secret',
      session: { expiresAt: new Date(+instant + 10 * 60000) },
    });
    expect(await findPreAuthSessionById(database.db, 'unknown', PreAuthPurpose.SignUp)).toMatchObject({
      payload: { identity, hints: { username: 'newcomer' }, next: '//evil.example' },
    });
    expect(await findUserByIdentity(database.db, identity)).toBeNull();
    expect(await findUserByUsername(database.db, 'newcomer')).toBeNull();
  });
});

describe('fetchSignUpPrefill', () => {
  const prefill = (token: string, at = instant) => fetchSignUpPrefill({ db: database.db, now: () => at }, { token });

  it('returns the hints and keeps the pending sign-up', async () => {
    const token = await startSignUp('200', { username: 'hinted', name: 'Hinted Name' });
    expect(await prefill(token)).toEqual({ username: 'hinted', name: 'Hinted Name' });
    expect(await prefill(token)).toEqual({ username: 'hinted', name: 'Hinted Name' });
  });

  it('falls back to the username hint for the name and to empty for the username', async () => {
    expect(await prefill(await startSignUp('201', { username: 'only-login' }))).toEqual({
      username: 'only-login',
      name: 'only-login',
    });
    expect(await prefill(await startSignUp('202'))).toEqual({ username: '', name: '' });
  });

  it.each(['', 'no-separator', '.secret', 'id.', 'a.b.c', 'absent.secret'])(
    'returns null for the malformed or unknown token %j',
    async (token) => {
      expect(await prefill(token)).toBeNull();
    },
  );

  it('returns null for a wrong secret and keeps the pending sign-up', async () => {
    const token = await startSignUp('204', { username: 'wrong-secret' });
    expect(await prefill(`${token.split('.')[0]}.other-secret`)).toBeNull();
    expect(await prefill(token)).toEqual({ username: 'wrong-secret', name: 'wrong-secret' });
  });

  it('returns null for a pre-auth session of another flow', async () => {
    await database.db.insert(tPreAuthSession).values({
      id: 'prefill-other',
      purpose: 'link' as PreAuthPurpose,
      secretHash: hashSessionSecret('prefill-other-secret'),
      payload: {},
      expiresAt: new Date(+instant + 60000),
    });
    expect(await prefill('prefill-other.prefill-other-secret')).toBeNull();
  });

  it('returns null for an expired pending sign-up', async () => {
    const token = await startSignUp('203');
    expect(await prefill(token, new Date(+instant + 10 * 60000))).toBeNull();
  });
});

describe('completeSignUp', () => {
  const complete = (token: string, username: string, name: string, sessionId = `done-${username}`) =>
    completeSignUp(deps(sessionId), { token, username, name });

  it('creates the user with its identity, ends the pending sign-up, and returns a session and next', async () => {
    const token = await startSignUp('300', {}, '/console');
    const result = await complete(token, 'signed-up', 'Signed Up');
    expect(result).toMatchObject({ token: 'done-signed-up.done-signed-up-secret', next: '/console' });
    const user = await findUserByIdentity(database.db, github('300'));
    expect(user).toMatchObject({ id: result!.session.userId, username: 'signed-up', name: 'Signed Up', aboutMe: '' });
    expect(await findPreAuthSessionById(database.db, 'pending-300', PreAuthPurpose.SignUp)).toBeNull();
  });

  it('returns null for a used pending sign-up and creates nothing', async () => {
    const token = await startSignUp('301');
    await complete(token, 'first-use', 'First Use');
    expect(await complete(token, 'second-use', 'Second Use')).toBeNull();
    expect(await findUserByUsername(database.db, 'second-use')).toBeNull();
  });

  it('returns null for a tampered or expired token and creates nothing', async () => {
    const token = await startSignUp('302');
    expect(await complete(`${token}x`, 'tampered', 'Tampered')).toBeNull();
    const expired = completeSignUp(deps('expired', new Date(+instant + 10 * 60000)), {
      token,
      username: 'expired',
      name: 'Expired',
    });
    expect(await expired).toBeNull();
    expect(await findUserByIdentity(database.db, github('302'))).toBeNull();
  });

  it.each([
    ['@leading', 'Leading', { username: '用户名不能以 @ 开头' }],
    ['alice', 'Not Alice', { username: '用户名已存在' }],
  ])('rejects the username %j as PARAMETER_INVALID and keeps the pending sign-up', async (username, name, value) => {
    const token = await startSignUp(`303-${username}`);
    await expect(complete(token, username, name)).rejects.toMatchObject({
      body: { detail: { tag: 'PARAMETER_INVALID', value } },
    });
    expect(await fetchSignUpPrefill({ db: database.db, now: () => instant }, { token })).not.toBeNull();
  });

  it('rejects a taken name as PARAMETER_INVALID and keeps the pending sign-up', async () => {
    const token = await startSignUp('304');
    await expect(complete(token, 'fresh-name', author.name)).rejects.toMatchObject({
      body: { detail: { tag: 'PARAMETER_INVALID', value: { name: '昵称已存在' } } },
    });
    expect(await fetchSignUpPrefill({ db: database.db, now: () => instant }, { token })).not.toBeNull();
  });

  it('creates one account when the same pending sign-up completes twice concurrently', async () => {
    const token = await startSignUp('306');
    const results = await Promise.allSettled([
      complete(token, 'concurrent', 'Concurrent', 'concurrent-a'),
      complete(token, 'concurrent', 'Concurrent', 'concurrent-b'),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled' && result.value)).toHaveLength(1);
    expect(await findUserByIdentity(database.db, github('306'))).toMatchObject({ username: 'concurrent' });
  });

  it('throws DATABASE_ERROR when the identity already has a user, creating nothing and keeping the pending sign-up', async () => {
    const token = await startSignUp('305');
    await createUser(database.db, { username: 'raced', name: 'Raced', aboutMe: '', identity: github('305') });
    await expect(complete(token, 'raced-again', 'Raced Again')).rejects.toMatchObject({
      body: { detail: { tag: 'DATABASE_ERROR' } },
    });
    expect(await findUserByUsername(database.db, 'raced-again')).toBeNull();
    expect(await fetchSignUpPrefill({ db: database.db, now: () => instant }, { token })).not.toBeNull();
  });
});

describe('cancelSignUp', () => {
  it('deletes the pending sign-up so it can no longer complete', async () => {
    const token = await startSignUp('400');
    await cancelSignUp({ db: database.db, now: () => instant }, { token });
    expect(await completeSignUp(deps('after-cancel'), { token, username: 'cancelled', name: 'Cancelled' })).toBeNull();
  });

  it('leaves an expired pending sign-up for the next creation to clear', async () => {
    const token = await startSignUp('402');
    await cancelSignUp({ db: database.db, now: () => new Date(+instant + 10 * 60000) }, { token });
    expect(await findPreAuthSessionById(database.db, 'pending-402', PreAuthPurpose.SignUp)).not.toBeNull();
  });

  it('leaves the pending sign-up for a wrong secret', async () => {
    const token = await startSignUp('401');
    await cancelSignUp({ db: database.db, now: () => instant }, { token: 'pending-401.wrong' });
    expect(await fetchSignUpPrefill({ db: database.db, now: () => instant }, { token })).not.toBeNull();
  });
});
