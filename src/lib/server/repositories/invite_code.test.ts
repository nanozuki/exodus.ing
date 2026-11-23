import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { Role } from '#lib/models/role.js';
import { createInviteCode, getInviteStatsOfUser } from './invite_code';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-invite');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

describe('createInviteCode', () => {
  it('issues only one code when two requests share a statistics snapshot concurrently', async () => {
    const db = database.db;
    const inviterId = 'user_author_2';
    const expectedStats = await getInviteStatsOfUser(db, inviterId);
    const params = { inviterId, roleKey: Role.ArticleAuthor, expectedStats };
    const results = await Promise.allSettled([createInviteCode(db, params), createInviteCode(db, params)]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });

  it('throws BAD_REQUEST with retry guidance when the statistics changed since the snapshot', async () => {
    const db = database.db;
    const inviterId = 'user_author_1';
    const expectedStats = await getInviteStatsOfUser(db, inviterId);
    const params = { inviterId, roleKey: Role.ArticleAuthor, expectedStats };
    await createInviteCode(db, params);
    await expect(createInviteCode(db, params)).rejects.toMatchObject({
      status: 400,
      body: { message: '邀请状态已变化，请重试' },
    });
  });
});
