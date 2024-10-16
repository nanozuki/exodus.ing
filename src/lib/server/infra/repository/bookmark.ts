import type { Bookmark, BookmarkInput, BookmarkRepository } from '$lib/domain/entities/bookmark';
import { and, eq } from 'drizzle-orm/sql';
import { tBookmark, type AppD1Database } from './schema';
import { wrap } from './utils';

export class D1BookmarkRepository implements BookmarkRepository {
  constructor(private db: AppD1Database) {}

  async listByUserId(userId: string): Promise<Bookmark[]> {
    return await wrap('bookmark.listByUserId', () =>
      this.db
        .select()
        .from(tBookmark)
        .where(eq(tBookmark.userId, userId))
        .orderBy(tBookmark.createdAt),
    );
  }

  async countByArticleId(articleId: string): Promise<number> {
    return await wrap('bookmark.countByArticleId', () =>
      this.db.$count(tBookmark, eq(tBookmark.articleId, articleId)),
    );
  }

  async create(input: BookmarkInput): Promise<void> {
    await wrap('bookmark.create', async () => {
      const bookmark = { ...input, createdAt: new Date() };
      await this.db.insert(tBookmark).values(bookmark);
    });
  }

  async delete(userId: string, articleId: string): Promise<void> {
    await wrap('bookmark.delete', () =>
      this.db
        .delete(tBookmark)
        .where(and(eq(tBookmark.userId, userId), eq(tBookmark.articleId, articleId))),
    );
  }
}
