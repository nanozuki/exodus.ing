import type { ArticleListItem } from '$lib/domain/entities/article';
import type { ArticleListService } from '$lib/domain/services/article_list';
import type { Paginated, Pagination } from '$lib/domain/values/page';

export class HomePage {
  constructor(private readonly articleList: ArticleListService) {}

  async getArticles(page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await this.articleList.listArticles(page);
  }
}
