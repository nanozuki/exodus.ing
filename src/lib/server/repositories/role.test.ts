import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tInviteCode, tUserRole } from '#lib/server/db/schema.js';
import { Role } from '#lib/models/role.js';
import { findInviteCodeByCode } from './invite_code';
import { createRoleOfUserByInviteCode } from './role';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-role');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

async function insertCode(code: string, roleKey: string = Role.ArticleAuthor): Promise<void> {
  await database.db.insert(tInviteCode).values({ code, inviterId: 'user_author_1', roleKey });
}

describe('createRoleOfUserByInviteCode', () => {
  it('marks the redeemed code used at the given time', async () => {
    const db = database.db;
    await insertCode('redeem-once');
    const usedAt = new Date('2026-05-01T12:00:00Z');
    await createRoleOfUserByInviteCode(db, { code: 'redeem-once', userId: 'user_reader_3', usedAt });
    expect((await findInviteCodeByCode(db, 'redeem-once'))?.usedAt).toEqual(usedAt);
  });

  it('lets one of two concurrent redemptions succeed and rejects the other as PARAMETER_INVALID on inviteCode', async () => {
    const db = database.db;
    await insertCode('redeem-race');
    const results = await Promise.allSettled(
      ['user_reader_1', 'user_reader_2'].map((userId) =>
        createRoleOfUserByInviteCode(db, { code: 'redeem-race', userId, usedAt: new Date() }),
      ),
    );
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: { body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码已被使用' } } } },
    });
  });

  it('throws PARAMETER_INVALID on inviteCode for a missing code', async () => {
    await expect(
      createRoleOfUserByInviteCode(database.db, { code: 'missing-code', userId: 'user_reader_1', usedAt: new Date() }),
    ).rejects.toMatchObject({
      body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码不存在' } } },
    });
  });

  it('keeps and returns the existing role of a user who already has it, and still consumes the code', async () => {
    const db = database.db;
    await insertCode('existing-role');
    const original = (await db.select().from(tUserRole).where(eq(tUserRole.userId, 'user_author_2')))[0];
    const usedAt = new Date('2026-05-02T12:00:00Z');
    expect(await createRoleOfUserByInviteCode(db, { code: 'existing-role', userId: 'user_author_2', usedAt })).toEqual(
      original,
    );
    expect((await findInviteCodeByCode(db, 'existing-role'))?.usedAt).toEqual(usedAt);
  });

  it('leaves the code unused when the role write fails', async () => {
    const db = database.db;
    await insertCode('rollback-role', 'reject-role');
    await db.execute(sql`ALTER TABLE user_role ADD CONSTRAINT test_reject_role CHECK (role_key <> 'reject-role')`);
    try {
      await expect(
        createRoleOfUserByInviteCode(db, { code: 'rollback-role', userId: 'user_reader_3', usedAt: new Date() }),
      ).rejects.toMatchObject({ status: 500, body: { detail: { tag: 'DATABASE_ERROR' } } });
      expect((await findInviteCodeByCode(db, 'rollback-role'))?.usedAt).toBeNull();
    } finally {
      await db.execute(sql`ALTER TABLE user_role DROP CONSTRAINT test_reject_role`);
    }
  });
});
