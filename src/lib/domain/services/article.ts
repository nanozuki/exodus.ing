import type {
  Article,
  ArticleInput,
  ArticlePatch,
  ArticleRepository,
} from '$lib/domain/entities/article';

export class ArticleService {
  constructor(private repository: ArticleRepository) {}

  async getById(articleId: string): Promise<Article> {
    return await this.repository.getById(articleId);
  }

  async create(article: ArticleInput): Promise<Article> {
    return await this.repository.create(article);
  }

  async update(articleId: string, patch: Partial<ArticlePatch>): Promise<Article> {
    return await this.repository.update(articleId, patch);
  }
}
