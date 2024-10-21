import type { ArticleListItem, ArticleRepository } from '$lib/domain/entities/article';
import type { Paginated } from '$lib/domain/values/page';

const PAGE_SIZE = 100;

export class ArticleListService {
  constructor(private repository: ArticleRepository) {}

  async list(pageNumber: number): Promise<Paginated<ArticleListItem>> {
    return await this.repository.list({ number: pageNumber, size: PAGE_SIZE });
  }

  async listByUserId(userId: string, pageNumber: number): Promise<Paginated<ArticleListItem>> {
    return await this.repository.listByUserId(userId, { number: pageNumber, size: PAGE_SIZE });
  }
}
