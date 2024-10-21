import type { ArticleService } from '$lib/domain/services/article';
import type { AuthService } from '$lib/domain/services/auth';
import { AppError } from '$lib/errors';

export interface ArticleContent {
  title: string;
  content: string;
}

export class ArticleEditPage {
  constructor(
    private readonly article: ArticleService,
    private readonly auth: AuthService,
  ) {}

  async getArticleContent(articleId: string): Promise<ArticleContent> {
    const user = this.auth.requireLoggedInUser('load article editor');
    const article = await this.article.getById(articleId);
    if (article.authorId !== user.id) {
      return AppError.Forbidden('article editor').throw();
    }
    return { title: article.title, content: article.content };
  }

  async createByMarkdown(content: string): Promise<string> {
    const user = this.auth.requireLoggedInUser('edit article');
    return await this.article.createByMarkdown(user.id, content);
  }

  async updateByMarkdown(articleId: string, content: string): Promise<void> {
    const user = this.auth.requireLoggedInUser('edit article');
    const article = await this.article.getById(articleId);
    if (article.authorId !== user.id) {
      return AppError.Forbidden('article editor').throw();
    }
    return await this.article.updateByMarkdown(articleId, content);
  }
}
