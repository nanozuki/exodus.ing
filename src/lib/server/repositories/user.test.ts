import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tUserIdentity } from '#lib/server/db/schema.js';
import { createUser, findUserById, findUserByIdentity, getIdentitiesOfUser, getUsers, updateUser } from './user';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-user');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

function profile(username: string) {
  return { username, name: `Name of ${username}`, aboutMe: '', identity: githubIdentity(`gh-${username}`) };
}

function githubIdentity(subject: string) {
  return { provider: 'github' as const, subject };
}

async function seededUser(username: string) {
  return (await getUsers(database.db)).find((user) => user.username === username)!;
}

describe('createUser', () => {
  it('generates a six-character ID and a 32-character verification code', async () => {
    const user = await createUser(database.db, profile('generated-ids'));
    expect(user.id).toMatch(/^[a-z0-9]{6}$/);
    expect(user.verifyCode).toMatch(/^[a-z0-9]{32}$/);
  });

  it('stores the identity so it finds the new user', async () => {
    const user = await createUser(database.db, profile('with-identity'));
    expect(await findUserByIdentity(database.db, githubIdentity('gh-with-identity'))).toEqual(user);
    expect(await getIdentitiesOfUser(database.db, user.id)).toEqual([
      { ...githubIdentity('gh-with-identity'), userId: user.id },
    ]);
  });

  it('throws PARAMETER_INVALID on username for a taken username and stores no identity', async () => {
    const db = database.db;
    await createUser(db, profile('taken-on-create'));
    const attempt = { ...profile('taken-on-create'), name: 'Other', identity: githubIdentity('gh-taken-retry') };
    await expect(createUser(db, attempt)).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { username: '用户名已存在' } } },
    });
    expect(await findUserByIdentity(db, githubIdentity('gh-taken-retry'))).toBeNull();
  });

  it('throws PARAMETER_INVALID on name for a taken name', async () => {
    const db = database.db;
    await createUser(db, profile('name-owner'));
    await expect(createUser(db, { ...profile('name-thief'), name: 'Name of name-owner' })).rejects.toMatchObject({
      body: { detail: { tag: 'PARAMETER_INVALID', value: { name: '昵称已存在' } } },
    });
  });

  it('throws DATABASE_ERROR for an identity another user holds and stores no user', async () => {
    const db = database.db;
    await createUser(db, profile('identity-owner'));
    const attempt = { ...profile('identity-copy'), identity: githubIdentity('gh-identity-owner') };
    await expect(createUser(db, attempt)).rejects.toMatchObject({
      body: { detail: { tag: 'DATABASE_ERROR', value: { operation: 'createUser' } } },
    });
    expect((await getUsers(db)).some((user) => user.username === 'identity-copy')).toBe(false);
  });
});

describe('findUserByIdentity', () => {
  it('returns null for an unknown subject', async () => {
    expect(await findUserByIdentity(database.db, githubIdentity('gh-nobody'))).toBeNull();
  });
});

describe('getIdentitiesOfUser', () => {
  it('returns every identity of the user, oldest first', async () => {
    const user = await createUser(database.db, profile('two-identities'));
    await database.db.insert(tUserIdentity).values({
      ...githubIdentity('gh-earlier'),
      userId: user.id,
      createdAt: new Date('2000-01-01T00:00:00Z'),
    });
    expect((await getIdentitiesOfUser(database.db, user.id)).map((identity) => identity.subject)).toEqual([
      'gh-earlier',
      'gh-two-identities',
    ]);
  });

  it('returns an empty list for an unknown user', async () => {
    expect(await getIdentitiesOfUser(database.db, 'absent')).toEqual([]);
  });
});

describe('findUserById', () => {
  it('finds a user by the first six characters of a 16-character legacy ID', async () => {
    const user = await createUser(database.db, profile('legacy-id'));
    expect(await findUserById(database.db, `${user.id}0123456789`)).toEqual(user);
  });
});

describe('getUsers', () => {
  it('returns every user ordered by ID', async () => {
    const ids = (await getUsers(database.db)).map((user) => user.id);
    expect(ids).toEqual([...ids].sort());
  });
});

describe('updateUser', () => {
  it('does nothing for an unknown ID', async () => {
    await expect(updateUser(database.db, { id: 'absent', name: 'no-op' })).resolves.toBeUndefined();
  });

  it("rejects another user's username as PARAMETER_INVALID on username without changes", async () => {
    const alice = await seededUser('alice');
    const bob = await seededUser('bob');
    await expect(updateUser(database.db, { id: alice.id, username: bob.username })).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { username: '用户名已存在' } } },
    });
    expect(await findUserById(database.db, alice.id)).toEqual(alice);
  });

  it("rejects another user's name as PARAMETER_INVALID on name without changes", async () => {
    const alice = await seededUser('alice');
    const bob = await seededUser('bob');
    await expect(updateUser(database.db, { id: alice.id, name: bob.name })).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { name: '昵称已存在' } } },
    });
    expect(await findUserById(database.db, alice.id)).toEqual(alice);
  });
});
