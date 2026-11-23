import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tArticle, tBookmark } from '#lib/server/db/schema.js';
import { createBookmark, deleteBookmark, getBookmarkStateOfArticle } from './bookmark';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-bookmark');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

async function bookmarkCountOf(articleId: string): Promise<number> {
  return (await database.db.select().from(tArticle).where(eq(tArticle.id, articleId)))[0].bookmarkCount;
}

async function relationshipsOf(params: { articleId: string; userId: string }): Promise<number> {
  return database.db.$count(
    tBookmark,
    and(eq(tBookmark.userId, params.userId), eq(tBookmark.articleId, params.articleId)),
  );
}

describe('createBookmark', () => {
  it('adds a duplicate relationship and counts it when the user already bookmarked the article', async () => {
    const db = database.db;
    const params = { articleId: 'A26', userId: 'user_reader_3' };
    const first = await createBookmark(db, params);
    const second = await createBookmark(db, params);
    expect(second).toMatchObject({ count: first.count + 1, bookmarked: true });
    await deleteBookmark(db, params);
  });
});

describe('deleteBookmark', () => {
  it('deletes every relationship of the user and article and subtracts them from the count', async () => {
    const db = database.db;
    const params = { articleId: 'A26', userId: 'user_reader_1' };
    await deleteBookmark(db, params);
    const before = await bookmarkCountOf(params.articleId);
    await createBookmark(db, params);
    await createBookmark(db, params);
    await deleteBookmark(db, params);
    expect(await relationshipsOf(params)).toBe(0);
    expect(await bookmarkCountOf(params.articleId)).toBe(before);
  });

  it('leaves the count unchanged when no relationship matches', async () => {
    const db = database.db;
    const params = { articleId: 'A26', userId: 'user_reader_3' };
    await deleteBookmark(db, params);
    const before = await bookmarkCountOf(params.articleId);
    await deleteBookmark(db, params);
    expect(await bookmarkCountOf(params.articleId)).toBe(before);
  });
});

describe('getBookmarkStateOfArticle', () => {
  it('reports bookmarked as null for an anonymous viewer', async () => {
    expect(await getBookmarkStateOfArticle(database.db, { articleId: 'A26' })).toMatchObject({
      articleId: 'A26',
      bookmarked: null,
    });
  });
});
