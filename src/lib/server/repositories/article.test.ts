import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { tArticle } from '#lib/server/db/schema.js';
import {
  createArticle,
  getArticleById,
  getRepliesOfArticle,
  listArticles,
  listArticlesOfUser,
  updateArticle,
} from './article';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('repository-article');
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

async function replyCountOf(id: string): Promise<number> {
  return (await database.db.select().from(tArticle).where(eq(tArticle.id, id)))[0].replyCount;
}

function markdown(authorId: string, title: string, replyToId?: string) {
  return { authorId, title, content: `# ${title}`, contentType: 'markdown' as const, replyToId };
}

describe('createArticle', () => {
  it('extends the parent ancestry into the path of a nested reply', async () => {
    const db = database.db;
    const root = await createArticle(db, markdown('user_author_1', 'path root'));
    const child = await createArticle(db, markdown('user_author_2', 'path child', root.id));
    const nested = await createArticle(db, markdown('user_author_1', 'path nested', child.id));
    expect(nested.path).toEqual([root.id, child.id, nested.id]);
  });

  it('returns the direct parent with its author as replyTo', async () => {
    const db = database.db;
    const parent = await createArticle(db, markdown('user_author_2', 'replyTo parent'));
    const reply = await createArticle(db, markdown('user_author_1', 'replyTo reply', parent.id));
    expect(reply.replyTo).toEqual({ id: parent.id, title: parent.title, author: parent.author });
  });

  it("increments the parent's reply count", async () => {
    const db = database.db;
    const parent = await createArticle(db, markdown('user_author_1', 'counted parent'));
    await createArticle(db, markdown('user_author_2', 'counted reply', parent.id));
    expect(await replyCountOf(parent.id)).toBe(1);
  });

  it("rolls back the article and the parent's reply count when mapping the author fails", async () => {
    const db = database.db;
    const before = await replyCountOf('A21');
    await expect(createArticle(db, markdown('absent', 'must roll back', 'A21'))).rejects.toMatchObject({
      status: 404,
    });
    expect(await db.$count(tArticle, eq(tArticle.title, 'must roll back'))).toBe(0);
    expect(await replyCountOf('A21')).toBe(before);
  });

  it("rejects the author's duplicate title as PARAMETER_INVALID on title", async () => {
    const db = database.db;
    const params = {
      authorId: 'user_author_1',
      title: 'Duplicate title',
      content: 'body',
      contentType: 'external' as const,
    };
    await createArticle(db, params);
    await expect(createArticle(db, params)).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { title: '你已经发布过同名文章' } } },
    });
  });
});

describe('updateArticle', () => {
  it("rejects a title the author already used as PARAMETER_INVALID on title and keeps the article's title", async () => {
    const db = database.db;
    const params = { authorId: 'user_author_2', content: 'body', contentType: 'external' as const };
    const first = await createArticle(db, { ...params, title: 'Taken title' });
    const second = await createArticle(db, { ...params, title: 'Other title' });
    await expect(updateArticle(db, { id: second.id, title: first.title })).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { title: '你已经发布过同名文章' } } },
    });
    expect((await getArticleById(db, second.id)).title).toBe('Other title');
  });
});

describe('getArticleById', () => {
  it('throws NOT_FOUND for a missing article', async () => {
    await expect(getArticleById(database.db, 'absent')).rejects.toMatchObject({ status: 404 });
  });
});

describe('getRepliesOfArticle', () => {
  it('returns the direct replies of a nested article with their authors', async () => {
    const db = database.db;
    const root = await createArticle(db, markdown('user_author_1', 'replies root'));
    const child = await createArticle(db, markdown('user_author_2', 'replies child', root.id));
    const nested = await createArticle(db, markdown('user_author_1', 'replies nested', child.id));
    expect(await getRepliesOfArticle(db, child.id)).toEqual([
      { id: nested.id, title: nested.title, author: nested.author },
    ]);
  });
});

describe('listArticles', () => {
  it('returns the requested page with the total count and each author', async () => {
    const db = database.db;
    const page = await listArticles(db, { pageNumber: 1, pageSize: 2 });
    expect(page).toMatchObject({ pageNumber: 1, pageSize: 2, count: await db.$count(tArticle) });
    expect(page.items).toHaveLength(2);
    expect(page.items.every((item) => item.author.id)).toBe(true);
  });
});

describe('listArticlesOfUser', () => {
  it('echoes the requested page with no items for a user without articles', async () => {
    expect(await listArticlesOfUser(database.db, 'absent', { pageNumber: 2, pageSize: 7 })).toEqual({
      pageNumber: 2,
      pageSize: 7,
      count: 0,
      items: [],
    });
  });
});
