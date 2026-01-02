import type { BookmarkStatus } from '$lib/domain/entities/bookmark';
import { and, eq, sql } from 'drizzle-orm/sql';
import { tArticle, tBookmark, type AppDatabase } from './schema';
import { wrap } from './utils';

export class PgBookmarkRepository {
  constructor(private db: AppDatabase) {}

  async getBookmarkStatus(articleId: string, userId?: string): Promise<BookmarkStatus> {
    return await wrap('bookmark.getBookmarkStatus', async () => {
      const [bookmarked, bookmarkCount] = await Promise.all([
        userId
          ? await this.db.$count(tBookmark, and(eq(tBookmark.articleId, articleId), eq(tBookmark.userId, userId)))
          : 0,
        this.db.$count(tBookmark, eq(tBookmark.articleId, articleId)),
      ]);
      return {
        isBookmarked: bookmarked > 0,
        bookmarkCount: bookmarkCount,
      };
    });
  }

  async create(articleId: string, userId: string): Promise<void> {
    await wrap('bookmark.create', async () => {
      const bookmark = { userId, articleId, createdAt: new Date() };
      await this.db.transaction(async (tx) => {
        await tx.insert(tBookmark).values(bookmark);
        await tx
          .update(tArticle)
          .set({ bookmarkCount: sql`${tArticle.bookmarkCount} + 1` })
          .where(eq(tArticle.id, articleId));
      });
    });
  }

  async delete(articleId: string, userId: string): Promise<void> {
    await wrap('bookmark.delete', async () => {
      await this.db.transaction(async (tx) => {
        await tx.delete(tBookmark).where(and(eq(tBookmark.userId, userId), eq(tBookmark.articleId, articleId)));
        await tx
          .update(tArticle)
          .set({ bookmarkCount: sql`${tArticle.bookmarkCount} - 1` })
          .where(eq(tArticle.id, articleId));
      });
    });
  }
}
