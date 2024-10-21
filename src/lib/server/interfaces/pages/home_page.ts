import type { ArticleListItem } from '$lib/domain/entities/article';
import type { ArticleListService } from '$lib/domain/services/article_list';
import type { Paginated } from '$lib/domain/values/page';

export class HomePage {
  constructor(private readonly articleList: ArticleListService) {}

  async getArticles(pageNumber: number): Promise<Paginated<ArticleListItem>> {
    return await this.articleList.list(pageNumber);
  }
}
