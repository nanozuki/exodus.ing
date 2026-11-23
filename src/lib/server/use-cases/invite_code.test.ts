import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { Role } from '#lib/models/role.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { acceptInviteCode, createInviteCode, getInviteQuota } from './invite_code';

let database: TestDatabase;
let author: LoggedInUser;
let reader: LoggedInUser;

beforeAll(async () => {
  database = await createTestDatabase('use-case-invite');
  author = { ...(await findUserByUsername(database.db, 'alice'))!, roles: [Role.ArticleAuthor] };
  reader = { ...(await findUserByUsername(database.db, 'carol'))!, roles: [] };
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

const instant = new Date('2026-06-01T00:00:00Z');

describe('createInviteCode', () => {
  it('throws FORBIDDEN for an actor without CreateArticle', async () => {
    await expect(createInviteCode({ db: database.db }, { actor: reader })).rejects.toMatchObject({ status: 403 });
  });
});

// Covers: createInviteCode, getInviteQuota
it("uses one unit of the actor's quota for each created code", async () => {
  const db = database.db;
  const before = await getInviteQuota({ db }, { userId: author.id });
  await createInviteCode({ db }, { actor: author });
  expect(await getInviteQuota({ db }, { userId: author.id })).toBe(before - 1);
});

describe('acceptInviteCode', () => {
  it('reads the clock once', async () => {
    const db = database.db;
    const invite = await createInviteCode({ db }, { actor: author });
    const now = vi.fn(() => instant);
    await acceptInviteCode({ db, now }, { actor: reader, code: invite.code });
    expect(now).toHaveBeenCalledTimes(1);
  });

  it('throws PARAMETER_INVALID on inviteCode for a used code', async () => {
    const db = database.db;
    const invite = await createInviteCode({ db }, { actor: author });
    const deps = { db, now: () => instant };
    await acceptInviteCode(deps, { actor: reader, code: invite.code });
    await expect(acceptInviteCode(deps, { actor: reader, code: invite.code })).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码已被使用' } } },
    });
  });

  it('throws PARAMETER_INVALID on inviteCode for a missing code', async () => {
    await expect(
      acceptInviteCode({ db: database.db, now: () => instant }, { actor: reader, code: 'absent' }),
    ).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码不存在' } } },
    });
  });
});
