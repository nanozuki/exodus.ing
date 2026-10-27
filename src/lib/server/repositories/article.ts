import type {
  Article,
  ArticleSummary,
  ArticleContent,
  ArticleContentType,
  ArticleFeedsItem,
  ArticleListItem,
} from '$lib/models/article';
import { decodePathField, encodeIdPath, getPathParent } from '$lib/models/id_path';
import type { Pagination, Paginated } from '$lib/models/page';
import { throwError } from '$lib/errors';
import { desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { tArticle, tBookmark, tUser, type AppDatabase } from '$lib/server/db/schema';
import { newNanoId, wrap } from './utils';

type QueryDatabase = Parameters<Parameters<AppDatabase['transaction']>[0]>[0];

const author = { id: tUser.id, username: tUser.username, name: tUser.name };
const summary = { id: tArticle.id, title: tArticle.title, author };
const record = {
  ...summary,
  path: tArticle.path,
  createdAt: tArticle.createdAt,
  updatedAt: tArticle.updatedAt,
  contentType: tArticle.contentType,
  content: tArticle.content,
};
const listItem = {
  ...record,
  replyCount: tArticle.replyCount,
  bookmarkCount: tArticle.bookmarkCount,
  commentCount: tArticle.commentCount,
};

const snapshot = { isolationLevel: 'repeatable read', accessMode: 'read only' } as const;

async function populateParents<T extends Article>(db: QueryDatabase, items: T[]): Promise<T[]> {
  const ids = [...new Set(items.map((item) => getPathParent(item.path)).filter((id): id is string => !!id))];
  if (!ids.length) return items;
  const parents = await db
    .select(summary)
    .from(tArticle)
    .innerJoin(tUser, eq(tArticle.userId, tUser.id))
    .where(inArray(tArticle.id, ids));
  const byId = new Map(parents.map((parent) => [parent.id, parent]));
  for (const item of items) {
    const parentId = getPathParent(item.path);
    if (parentId)
      item.replyTo =
        byId.get(parentId) ??
        throwError('INTERNAL_SERVER_ERROR', `Can't find article ${item.id}'s replyTo ${parentId}`);
  }
  return items;
}

async function readArticle(db: QueryDatabase, articleId: string): Promise<Article> {
  const rows = await db
    .select(record)
    .from(tArticle)
    .innerJoin(tUser, eq(tArticle.userId, tUser.id))
    .where(eq(tArticle.id, articleId));
  if (!rows.length) return throwError('NOT_FOUND', { resource: '文章' });
  return (await populateParents(db, rows.map(decodePathField)))[0];
}

// Author and parent projections reflect one consistent snapshot.
export async function getArticleById(db: AppDatabase, articleId: string): Promise<Article> {
  return wrap('getArticleById', () => db.transaction((tx) => readArticle(tx, articleId), snapshot));
}

// This read remains available even when the stored author relationship is missing.
export async function getArticleContentById(db: AppDatabase, articleId: string): Promise<ArticleContent> {
  return wrap(
    'getArticleContentById',
    async () =>
      (
        await db
          .select({
            id: tArticle.id,
            title: tArticle.title,
            content: tArticle.content,
            contentType: tArticle.contentType,
          })
          .from(tArticle)
          .where(eq(tArticle.id, articleId))
      )[0] ?? throwError('NOT_FOUND', { resource: '文章' }),
  );
}

export async function getArticleSummaryById(db: AppDatabase, articleId: string): Promise<ArticleSummary> {
  return wrap(
    'getArticleSummaryById',
    async () =>
      (
        await db
          .select(summary)
          .from(tArticle)
          .innerJoin(tUser, eq(tArticle.userId, tUser.id))
          .where(eq(tArticle.id, articleId))
      )[0] ?? throwError('NOT_FOUND', { resource: '文章' }),
  );
}

async function list(
  db: AppDatabase,
  page: Pagination,
  condition?: SQL,
  bookmarked = false,
): Promise<Paginated<ArticleListItem>> {
  return db.transaction(async (tx) => {
    const count = await tx.$count(bookmarked ? tBookmark : tArticle, condition);
    const query = tx.select(listItem).from(tArticle).innerJoin(tUser, eq(tArticle.userId, tUser.id)).$dynamic();
    const rows = await (bookmarked ? query.innerJoin(tBookmark, eq(tBookmark.articleId, tArticle.id)) : query)
      .where(condition)
      .orderBy(desc(tArticle.createdAt))
      .limit(page.pageSize)
      .offset((page.pageNumber - 1) * page.pageSize);
    return { ...page, count, items: await populateParents(tx, rows.map(decodePathField)) };
  }, snapshot);
}

// Pages are creation-descending; their rows, total and parent projections share a snapshot.
export async function listArticles(db: AppDatabase, page: Pagination): Promise<Paginated<ArticleListItem>> {
  return wrap('listArticles', () => list(db, page));
}

export async function listArticlesOfUser(
  db: AppDatabase,
  userId: string,
  page: Pagination,
): Promise<Paginated<ArticleListItem>> {
  return wrap('listArticlesOfUser', () => list(db, page, eq(tArticle.userId, userId)));
}

// A duplicate bookmark relationship can repeat an article within the results.
export async function listBookmarkedArticlesOfUser(
  db: AppDatabase,
  userId: string,
  page: Pagination,
): Promise<Paginated<ArticleListItem>> {
  return wrap('listBookmarkedArticlesOfUser', () => list(db, page, eq(tBookmark.userId, userId), true));
}

// Trailing-slash paths put the direct parent in the third segment from the end.
export async function getRepliesOfArticle(db: AppDatabase, articleId: string): Promise<ArticleSummary[]> {
  return wrap('getRepliesOfArticle', () =>
    db
      .select(summary)
      .from(tArticle)
      .innerJoin(tUser, eq(tArticle.userId, tUser.id))
      .where(eq(sql<string>`split_part(${tArticle.path}, '/', -3)`, articleId)),
  );
}

export async function listArticleFeeds(db: AppDatabase, page: Pagination): Promise<Paginated<ArticleFeedsItem>> {
  return wrap('listArticleFeeds', () =>
    db.transaction(
      async (tx) => ({
        ...page,
        count: await tx.$count(tArticle),
        items: await tx
          .select({
            ...summary,
            createdAt: tArticle.createdAt,
            updatedAt: tArticle.updatedAt,
            contentType: tArticle.contentType,
            content: tArticle.content,
          })
          .from(tArticle)
          .innerJoin(tUser, eq(tArticle.userId, tUser.id))
          .orderBy(desc(tArticle.updatedAt))
          .limit(page.pageSize)
          .offset((page.pageNumber - 1) * page.pageSize),
      }),
      snapshot,
    ),
  );
}

export interface CreateArticleParams {
  title: string;
  authorId: string;
  contentType: ArticleContentType;
  content: string;
  replyToId?: string;
}

export async function createArticle(db: AppDatabase, params: CreateArticleParams): Promise<Article> {
  return wrap('createArticle', () =>
    db.transaction(async (tx) => {
      let id = newNanoId();
      while (await tx.$count(tArticle, eq(tArticle.id, id))) id = newNanoId();
      const path = params.replyToId ? [...(await readArticle(tx, params.replyToId)).path, id] : [id];
      const now = new Date();
      await tx.insert(tArticle).values({
        id,
        userId: params.authorId,
        title: params.title,
        contentType: params.contentType,
        content: params.content,
        path: encodeIdPath(path),
        createdAt: now,
        updatedAt: now,
      });
      if (params.replyToId)
        await tx
          .update(tArticle)
          .set({ replyCount: sql`${tArticle.replyCount} + 1` })
          .where(eq(tArticle.id, params.replyToId));
      // Map before commit so a missing author/parent rolls back the insert and counters.
      return readArticle(tx, id);
    }),
  );
}

export interface UpdateArticleParams {
  id: string;
  title?: string;
  content?: string;
}

// This operation leaves updatedAt unchanged.
export async function updateArticle(db: AppDatabase, { id, ...patch }: UpdateArticleParams): Promise<void> {
  return wrap('updateArticle', async () => {
    await db.update(tArticle).set(patch).where(eq(tArticle.id, id));
  });
}
