import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tComment } from '#lib/server/db/schema.js';
import { createComment, listCommentsOfUser } from './comment';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-comment');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

describe('createComment', () => {
  it('extends the parent comment into the path of a reply', async () => {
    const db = database.db;
    const userId = 'user_reader_3';
    const first = await createComment(db, { userId, articleId: 'A26', content: 'first' });
    const reply = await createComment(db, { userId, articleId: 'A26', content: 'reply', replyToId: first.id });
    expect(reply.path).toEqual([first.id, reply.id]);
  });

  it('writes nothing when mapping a missing user fails', async () => {
    const db = database.db;
    const before = await db.$count(tComment);
    await expect(createComment(db, { userId: 'absent', articleId: 'A26', content: 'rollback' })).rejects.toMatchObject({
      status: 404,
    });
    expect(await db.$count(tComment)).toBe(before);
  });

  it('throws NOT_FOUND for a missing reply parent', async () => {
    await expect(
      createComment(database.db, {
        userId: 'user_reader_3',
        articleId: 'A26',
        content: 'bad parent',
        replyToId: 'absent',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws NOT_FOUND for a missing article and writes nothing', async () => {
    const db = database.db;
    const before = await db.$count(tComment);
    await expect(
      createComment(db, { articleId: 'absent', userId: 'user_reader_1', content: 'orphan' }),
    ).rejects.toMatchObject({ status: 404, body: { detail: { tag: 'NOT_FOUND' } } });
    expect(await db.$count(tComment)).toBe(before);
  });
});

describe('listCommentsOfUser', () => {
  it('pages comments before grouping them by article', async () => {
    const db = database.db;
    const userId = 'user_reader_2';
    await createComment(db, { userId, articleId: 'A26', content: 'grouped one' });
    await createComment(db, { userId, articleId: 'A26', content: 'grouped two' });
    const page = await listCommentsOfUser(db, userId, { pageNumber: 1, pageSize: 1 });
    expect(page.pageSize).toBe(1);
    expect(page.items.flatMap((item) => item.comments)).toHaveLength(1);
  });

  it("includes each group's article with its author", async () => {
    const page = await listCommentsOfUser(database.db, 'user_reader_3', { pageNumber: 1, pageSize: 5 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((item) => item.article.author.id)).toBe(true);
  });
});
