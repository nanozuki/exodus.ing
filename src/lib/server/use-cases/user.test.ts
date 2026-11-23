import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { Role } from '#lib/models/role.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { loginWithGitHub, updateUsername, validateSignUp } from './user';

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

function loginDeps(sessionId: string) {
  return {
    db: database.db,
    now: () => instant,
    random: { sessionId: () => sessionId, sessionSecret: () => `${sessionId}-secret` },
  };
}

describe('validateSignUp', () => {
  it('throws PARAMETER_INVALID for a username starting with @', async () => {
    await expect(validateSignUp({ db: database.db }, { username: '@invalid' })).rejects.toMatchObject({
      body: { detail: { tag: 'PARAMETER_INVALID' } },
    });
  });

  it('throws PARAMETER_INVALID for a taken username', async () => {
    await expect(validateSignUp({ db: database.db }, { username: author.username })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('throws PARAMETER_INVALID for a taken name', async () => {
    await expect(validateSignUp({ db: database.db }, { name: author.name })).rejects.toMatchObject({ status: 400 });
  });
});

describe('updateUsername', () => {
  it("accepts the actor's current username as a no-op", async () => {
    await expect(
      updateUsername({ db: database.db }, { actor: author, username: author.username }),
    ).resolves.toBeUndefined();
  });
});

describe('loginWithGitHub', () => {
  it('creates an account from signUp with an empty bio and returns its session token', async () => {
    const result = await loginWithGitHub(loginDeps('github-new'), {
      githubUser: { id: 987654, username: 'new-github' },
      signUp: { name: 'New GitHub' },
    });
    expect(result.token).toBe('github-new.github-new-secret');
    expect(await findUserByUsername(database.db, 'new-github')).toMatchObject({
      id: result.session.userId,
      name: 'New GitHub',
      aboutMe: '',
    });
  });

  it('reuses the account with the same GitHub ID unchanged', async () => {
    const first = await loginWithGitHub(loginDeps('github-first'), {
      githubUser: { id: 123456, username: 'linked-github' },
      signUp: { name: 'Linked GitHub' },
    });
    const second = await loginWithGitHub(loginDeps('github-second'), {
      githubUser: { id: 123456, username: 'renamed-github' },
      signUp: { username: 'overwrite' },
    });
    expect(second.session.userId).toBe(first.session.userId);
    expect(await findUserByUsername(database.db, 'overwrite')).toBeNull();
    expect(await findUserByUsername(database.db, 'linked-github')).toMatchObject({ name: 'Linked GitHub' });
  });
});
