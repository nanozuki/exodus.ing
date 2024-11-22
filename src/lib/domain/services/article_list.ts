import { ARTICLE_PAGE_SIZE, type ArticleListItem, type ArticleRepository } from '$lib/domain/entities/article';
import type { Paginated } from '$lib/domain/values/page';

export class ArticleListService {
  constructor(private repository: ArticleRepository) {}

  async list(pageNumber: number): Promise<Paginated<ArticleListItem>> {
    return await this.repository.list({ pageNumber: pageNumber, pageSize: ARTICLE_PAGE_SIZE });
  }

  async listByUserId(userId: string, pageNumber: number): Promise<Paginated<ArticleListItem>> {
    return await this.repository.listByUserId(userId, { pageNumber: pageNumber, pageSize: ARTICLE_PAGE_SIZE });
  }

  async listUserBookmarked(userId: string, pageNumber: number): Promise<Paginated<ArticleListItem>> {
    return await this.repository.listUserBookmarks(userId, { pageNumber: pageNumber, pageSize: ARTICLE_PAGE_SIZE });
  }
}
