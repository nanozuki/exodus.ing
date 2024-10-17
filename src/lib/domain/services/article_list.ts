import type { ArticleListItem, ArticleRepository } from '$lib/domain/entities/article';
import type { Paginated, Pagination } from '$lib/domain/values/page';

export class ArticleListService {
  constructor(private repository: ArticleRepository) {}

  async listArticles(page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await this.repository.list(page);
  }

  async listArticlesByUserId(
    userId: string,
    page: Pagination,
  ): Promise<Paginated<ArticleListItem>> {
    return await this.repository.listByUserId(userId, page);
  }
}
