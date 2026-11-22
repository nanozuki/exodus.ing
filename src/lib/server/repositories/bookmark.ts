// bookmark.ts reads bookmark state and keeps relationship changes consistent with the article's persisted bookmark
// count.

import type { BookmarkState } from '#lib/models/bookmark.js';
import { and, eq, sql } from 'drizzle-orm';
import { tArticle, tBookmark, type AppDatabase } from '#lib/server/db/schema.js';
import { wrap } from './utils';

type QueryDatabase = Pick<AppDatabase, 'select'>;

async function state(
  db: QueryDatabase,
  { articleId, userId }: GetBookmarkStateOfArticleParams,
): Promise<BookmarkState> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::integer`,
      bookmarked:
        userId === undefined
          ? sql<null>`null`
          : sql<boolean>`coalesce(bool_or(${tBookmark.userId} = ${userId}), false)`,
    })
    .from(tBookmark)
    .where(eq(tBookmark.articleId, articleId));
  return { articleId, ...row };
}

/** Omit `userId` for an anonymous viewer. */
export interface GetBookmarkStateOfArticleParams {
  articleId: string;
  userId?: string;
}

/**
 * Reads, in one statement, the number of bookmark relationship rows for the article (0 when none) and whether the
 * viewer has any of them: `bookmarked` is null for an anonymous viewer and a boolean otherwise.
 */
export async function getBookmarkStateOfArticle(
  db: AppDatabase,
  params: GetBookmarkStateOfArticleParams,
): Promise<BookmarkState> {
  return wrap('getBookmarkStateOfArticle', () => state(db, params));
}

export interface CreateBookmarkParams {
  articleId: string;
  userId: string;
}

/**
 * Inserts one relationship and increments the article's bookmark count in one transaction, then returns the state read
 * in that transaction, with `bookmarked` true. It does not check for an existing relationship; the schema permits
 * duplicates.
 */
export async function createBookmark(db: AppDatabase, params: CreateBookmarkParams): Promise<BookmarkState> {
  return wrap('createBookmark', () =>
    db.transaction(async (tx) => {
      await tx.insert(tBookmark).values({ ...params, createdAt: new Date() });
      await tx
        .update(tArticle)
        .set({ bookmarkCount: sql`${tArticle.bookmarkCount} + 1` })
        .where(eq(tArticle.id, params.articleId));
      return state(tx, params);
    }),
  );
}

export interface DeleteBookmarkParams {
  articleId: string;
  userId: string;
}

/**
 * Deletes every matching relationship and decrements the article's bookmark count by the number of rows deleted, in
 * one transaction. Deleting nothing leaves the count unchanged.
 */
export async function deleteBookmark(db: AppDatabase, params: DeleteBookmarkParams): Promise<void> {
  return wrap('deleteBookmark', () =>
    db.transaction(async (tx) => {
      // Duplicate relationships and repeated removals require counting rows actually deleted.
      const deleted = await tx
        .delete(tBookmark)
        .where(and(eq(tBookmark.userId, params.userId), eq(tBookmark.articleId, params.articleId)))
        .returning({ articleId: tBookmark.articleId });
      if (deleted.length)
        await tx
          .update(tArticle)
          .set({ bookmarkCount: sql`${tArticle.bookmarkCount} - ${deleted.length}` })
          .where(eq(tArticle.id, params.articleId));
    }),
  );
}
