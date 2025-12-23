import type { Bookmark } from '$lib/domain/entities/bookmark';
import { and, eq, sql } from 'drizzle-orm/sql';
import { tArticle, tBookmark, type AppDatabase } from './schema';
import { wrap } from './utils';

export class PgBookmarkRepository {
  constructor(private db: AppDatabase) {}

  async listByUserId(userId: string): Promise<Bookmark[]> {
    return await wrap('bookmark.listByUserId', () =>
      this.db.select().from(tBookmark).where(eq(tBookmark.userId, userId)).orderBy(tBookmark.createdAt),
    );
  }

  async isBookmarked(articleId: string, userId: string): Promise<boolean> {
    return await wrap('bookmark.isBookmarked', async () => {
      const count = await this.db.$count(
        tBookmark,
        and(eq(tBookmark.articleId, articleId), eq(tBookmark.userId, userId)),
      );
      return count > 0;
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
