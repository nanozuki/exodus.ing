import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { and, eq, sql } from 'drizzle-orm';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tArticle, tBookmark, tComment, tInviteCode, tUserRole } from '#lib/server/db/schema.js';
import * as articles from './article';
import * as bookmarks from './bookmark';
import * as comments from './comment';
import * as invites from './invite_code';
import * as roles from './role';
import * as users from './user';
import { Role } from '#lib/models/role.js';

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>();
  let sequence = 0;
  return {
    ...actual,
    newNanoId: () => `t${String(++sequence).padStart(5, '0')}`,
    newCode: () => `test${String(++sequence).padStart(12, '0')}`,
    newVerifyCode: () => 'v'.repeat(32),
  };
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-07-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-contracts');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

describe('repository contracts against PostgreSQL', () => {
  it('maps nested authors and direct parents at every depth, with effective pagination', async () => {
    const db = database.db;
    const root = await articles.createArticle(db, {
      authorId: 'user_author_1',
      title: 'contract root',
      content: '# root',
      contentType: 'markdown',
    });
    const child = await articles.createArticle(db, {
      authorId: 'user_author_2',
      title: 'contract child',
      content: '# child',
      contentType: 'markdown',
      replyToId: root.id,
    });
    const nested = await articles.createArticle(db, {
      authorId: 'user_author_1',
      title: 'contract nested',
      content: '# nested',
      contentType: 'markdown',
      replyToId: child.id,
    });
    expect(nested.path).toEqual([root.id, child.id, nested.id]);
    expect(nested.replyTo).toEqual({ id: child.id, title: child.title, author: child.author });
    expect(await articles.getRepliesOfArticle(db, child.id)).toEqual([
      { id: nested.id, title: nested.title, author: nested.author },
    ]);
    const page = await articles.listArticles(db, { pageNumber: 1, pageSize: 2 });
    expect(page).toMatchObject({ pageNumber: 1, pageSize: 2, count: 29 });
    expect(page.items).toHaveLength(2);
    expect(page.items[0].author.id).toBeDefined();
    expect((await db.select().from(tArticle).where(eq(tArticle.id, root.id)))[0].replyCount).toBe(1);
    expect(await articles.listArticlesOfUser(db, 'absent', { pageNumber: 2, pageSize: 7 })).toEqual({
      pageNumber: 2,
      pageSize: 7,
      count: 0,
      items: [],
    });
    await expect(articles.getArticleById(db, 'absent')).rejects.toMatchObject({ status: 404 });
  });

  it('rolls back article creation and parent count when author mapping fails', async () => {
    const db = database.db;
    const before = (await db.select().from(tArticle).where(eq(tArticle.id, 'A21')))[0];
    await expect(
      articles.createArticle(db, {
        authorId: 'absent',
        title: 'must roll back',
        content: '',
        contentType: 'markdown',
        replyToId: 'A21',
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(await db.$count(tArticle, eq(tArticle.title, 'must roll back'))).toBe(0);
    expect((await db.select().from(tArticle).where(eq(tArticle.id, 'A21')))[0].replyCount).toBe(before.replyCount);
  });

  it('counts actual duplicate bookmarks and subtracts only deleted relationships', async () => {
    const db = database.db;
    const params = { articleId: 'A26', userId: 'user_reader_3' };
    await bookmarks.deleteBookmark(db, params);
    const before = (await db.select().from(tArticle).where(eq(tArticle.id, params.articleId)))[0].bookmarkCount;
    const first = await bookmarks.createBookmark(db, params);
    const second = await bookmarks.createBookmark(db, params);
    expect(second.count).toBe(first.count + 1);
    expect(second.bookmarked).toBe(true);
    expect(await bookmarks.getBookmarkStateOfArticle(db, { articleId: params.articleId })).toMatchObject({
      articleId: params.articleId,
      bookmarked: null,
    });
    await bookmarks.deleteBookmark(db, params);
    await bookmarks.deleteBookmark(db, params);
    expect(
      await db.$count(tBookmark, and(eq(tBookmark.userId, params.userId), eq(tBookmark.articleId, params.articleId))),
    ).toBe(0);
    expect((await db.select().from(tArticle).where(eq(tArticle.id, params.articleId)))[0].bookmarkCount).toBe(before);
  });

  it('creates comment ancestry atomically and pages raw comments before grouping', async () => {
    const db = database.db;
    const userId = 'user_reader_3';
    const first = await comments.createComment(db, { userId, articleId: 'A26', content: 'first' });
    const reply = await comments.createComment(db, { userId, articleId: 'A26', content: 'reply', replyToId: first.id });
    expect(reply.path).toEqual([first.id, reply.id]);
    const page = await comments.listCommentsOfUser(db, userId, { pageNumber: 1, pageSize: 1 });
    expect(page.pageSize).toBe(1);
    expect(page.items.flatMap((item) => item.comments)).toHaveLength(1);
    expect(page.items[0].article.author.id).toBeDefined();
    const count = await db.$count(tComment);
    await expect(
      comments.createComment(db, { userId: 'absent', articleId: 'A26', content: 'rollback' }),
    ).rejects.toMatchObject({ status: 404 });
    expect(await db.$count(tComment)).toBe(count);
    await expect(
      comments.createComment(db, { userId, articleId: 'A26', content: 'bad parent', replyToId: 'absent' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('rejects a stale invitation snapshot and concurrent over-issuance', async () => {
    const db = database.db;
    const inviterId = 'user_author_2';
    const expectedStats = await invites.getInviteStatsOfUser(db, inviterId);
    const params = { inviterId, roleKey: Role.ArticleAuthor, expectedStats };
    const results = await Promise.allSettled([
      invites.createInviteCode(db, params),
      invites.createInviteCode(db, params),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    await expect(invites.createInviteCode(db, params)).rejects.toMatchObject({
      status: 400,
      body: { message: '邀请状态已变化，请重试' },
    });
  });

  it('redeems invitations once and preserves an already assigned role', async () => {
    const db = database.db;
    await db
      .insert(tInviteCode)
      .values({ code: 'contract-redeem', inviterId: 'user_author_1', roleKey: Role.ArticleAuthor });
    const usedAt = new Date('2026-05-01T12:00:00Z');
    const results = await Promise.allSettled(
      ['user_reader_1', 'user_reader_2'].map((userId) =>
        roles.createRoleOfUserByInviteCode(db, { code: 'contract-redeem', userId, usedAt }),
      ),
    );
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect((await invites.findInviteCodeByCode(db, 'contract-redeem'))?.usedAt).toEqual(usedAt);
    await db
      .insert(tInviteCode)
      .values({ code: 'contract-existing-role', inviterId: 'user_author_2', roleKey: Role.ArticleAuthor });
    const original = (await db.select().from(tUserRole).where(eq(tUserRole.userId, 'user_author_1')))[0];
    expect(
      await roles.createRoleOfUserByInviteCode(db, { code: 'contract-existing-role', userId: 'user_author_1', usedAt }),
    ).toEqual(original);
    expect((await invites.findInviteCodeByCode(db, 'contract-existing-role'))?.usedAt).toEqual(usedAt);
  });

  it('rolls back invitation consumption when a role write fails', async () => {
    const db = database.db;
    await db
      .insert(tInviteCode)
      .values({ code: 'contract-rollback', inviterId: 'user_author_1', roleKey: 'reject-role' });
    await db.execute(sql`ALTER TABLE user_role ADD CONSTRAINT contract_reject_role CHECK (role_key <> 'reject-role')`);
    await expect(
      roles.createRoleOfUserByInviteCode(db, {
        code: 'contract-rollback',
        userId: 'user_reader_3',
        usedAt: new Date(),
      }),
    ).rejects.toMatchObject({ status: 500, body: { detail: { tag: 'DATABASE_ERROR' } } });
    expect((await invites.findInviteCodeByCode(db, 'contract-rollback'))?.usedAt).toBeNull();
    await db.execute(sql`ALTER TABLE user_role DROP CONSTRAINT contract_reject_role`);
  });

  it('returns complete users, preserves legacy IDs, and normalizes database errors', async () => {
    const db = database.db;
    const user = await users.createUser(db, {
      username: 'contract-user',
      name: 'Contract User',
      githubId: null,
      aboutMe: '',
    });
    expect(user.id).toMatch(/^[a-z0-9]{6}$/);
    expect(user.verifyCode).toMatch(/^[a-z0-9]{32}$/);
    expect(await users.findUserById(db, `${user.id}0123456789`)).toEqual(user);
    expect((await users.getUsers(db)).map((user) => user.id)).toEqual(
      (await users.getUsers(db)).map((user) => user.id).sort(),
    );
    await expect(
      users.createUser(db, { username: user.username, name: 'Other', githubId: null, aboutMe: '' }),
    ).rejects.toMatchObject({ body: { detail: { tag: 'DATABASE_ERROR', value: { operation: 'createUser' } } } });
    await users.updateUser(db, { id: 'absent', name: 'no-op' });
  });
});

it('maps known write conflicts to fields without changing stored data', async () => {
  const db = database.db;
  const all = await users.getUsers(db);
  const alice = all.find((user) => user.username === 'alice')!;
  const bob = all.find((user) => user.username === 'bob')!;
  await expect(users.updateUser(db, { id: alice.id, username: bob.username })).rejects.toMatchObject({
    status: 400,
    body: { detail: { tag: 'PARAMETER_INVALID', value: { username: '用户名已存在' } } },
  });
  await expect(users.updateUser(db, { id: alice.id, name: bob.name })).rejects.toMatchObject({
    status: 400,
    body: { detail: { tag: 'PARAMETER_INVALID', value: { name: '昵称已存在' } } },
  });
  expect(await users.findUserById(db, alice.id)).toEqual(alice);
  const params = {
    authorId: alice.id,
    title: 'Unique conflict contract',
    content: 'body',
    contentType: 'external' as const,
  };
  const first = await articles.createArticle(db, params);
  await expect(articles.createArticle(db, params)).rejects.toMatchObject({
    status: 400,
    body: { detail: { tag: 'PARAMETER_INVALID', value: { title: '你已经发布过同名文章' } } },
  });
  const second = await articles.createArticle(db, { ...params, title: 'Other conflict contract' });
  await expect(articles.updateArticle(db, { id: second.id, title: first.title })).rejects.toMatchObject({
    status: 400,
    body: { detail: { tag: 'PARAMETER_INVALID', value: { title: '你已经发布过同名文章' } } },
  });
  expect((await articles.getArticleById(db, second.id)).title).toBe('Other conflict contract');
});

it('reports both missing and concurrently consumed invitations against inviteCode', async () => {
  const db = database.db;
  await expect(
    roles.createRoleOfUserByInviteCode(db, {
      code: 'missing-contract-code',
      userId: 'user_reader_1',
      usedAt: new Date(),
    }),
  ).rejects.toMatchObject({
    body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码不存在' } } },
  });
  await db.insert(tInviteCode).values({ code: 'field-race', inviterId: 'user_author_1', roleKey: Role.ArticleAuthor });
  const results = await Promise.allSettled(
    ['user_reader_1', 'user_reader_2'].map((userId) =>
      roles.createRoleOfUserByInviteCode(db, { code: 'field-race', userId, usedAt: new Date() }),
    ),
  );
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  const rejected = results.find((result) => result.status === 'rejected');
  expect(rejected).toMatchObject({
    status: 'rejected',
    reason: { body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码已被使用' } } } },
  });
});

it('rejects missing discussion context without saving a comment', async () => {
  const db = database.db;
  const before = await db.$count(tComment);
  await expect(
    comments.createComment(db, { articleId: 'absent', userId: 'user_reader_1', content: 'orphan' }),
  ).rejects.toMatchObject({ status: 404, body: { detail: { tag: 'NOT_FOUND' } } });
  expect(await db.$count(tComment)).toBe(before);
});
