import type { BookmarkRepository } from '$lib/domain/entities/bookmark';

export class BookmarkService {
  constructor(private repository: BookmarkRepository) {}

  async isBookmarked(articleId: string, userId: string): Promise<boolean> {
    return await this.repository.isBookmarked(articleId, userId);
  }

  async addBookmark(articleId: string, userId: string): Promise<void> {
    return await this.repository.create(articleId, userId);
  }

  async removeBookmark(articleId: string, userId: string): Promise<void> {
    return await this.repository.delete(articleId, userId);
  }
}
