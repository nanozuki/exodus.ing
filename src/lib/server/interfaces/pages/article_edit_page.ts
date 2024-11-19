import type { ArticleEditorData, GetArticleEditorDataRequest } from '$lib/domain/entities/article';
import type { ArticleService } from '$lib/domain/services/article';
import type { AuthService } from '$lib/domain/services/auth';
import { AppError } from '$lib/errors';

export class ArticleEditPage {
  constructor(
    private readonly article: ArticleService,
    private readonly auth: AuthService,
  ) {}

  async getArticleContent(req: GetArticleEditorDataRequest): Promise<ArticleEditorData> {
    return await this.article.getArticleEditorData(req);
  }

  async createByMarkdown(content: string, replyTo?: string): Promise<string> {
    const user = this.auth.requireLoggedInUser('edit article');
    return await this.article.createByMarkdown(user.id, content, replyTo);
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
