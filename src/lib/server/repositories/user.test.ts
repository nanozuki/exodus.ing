import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { createUser, findUserById, getUsers, updateUser } from './user';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-user');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

function profile(username: string) {
  return { username, name: `Name of ${username}`, githubId: null, aboutMe: '' };
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

  it('throws DATABASE_ERROR for a taken username', async () => {
    const db = database.db;
    await createUser(db, profile('taken-on-create'));
    await expect(createUser(db, { ...profile('taken-on-create'), name: 'Other' })).rejects.toMatchObject({
      body: { detail: { tag: 'DATABASE_ERROR', value: { operation: 'createUser' } } },
    });
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
