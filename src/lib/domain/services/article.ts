import type {
  Article,
  ArticleCard,
  ArticleEditorData,
  ArticleRepository,
  GetArticleEditorDataRequest,
} from '$lib/domain/entities/article';
import { compileArticle, throwResultError } from '$lib/markdown';
import { AppError } from '$lib/errors';

export class ArticleService {
  constructor(private repository: ArticleRepository) {}

  async getById(articleId: string): Promise<Article> {
    return await this.repository.getById(articleId);
  }

  async getArticleEditorData(req: GetArticleEditorDataRequest): Promise<ArticleEditorData> {
    return await this.repository.getArticleEditorData(req);
  }

  async createByMarkdown(userId: string, content: string, replyTo?: string): Promise<string> {
    const result = await compileArticle(content);
    if (!result.ok) {
      return throwResultError(result.errors);
    }
    return await this.repository.create({
      userId,
      content,
      title: result.title,
      contentType: 'markdown',
      replyTo,
    });
  }

  async updateByMarkdown(userId: string, articleId: string, content: string): Promise<void> {
    const article = await this.repository.getById(articleId);
    if (article.authorId !== userId) {
      return AppError.Forbidden('article editor').throw();
    }
    const result = await compileArticle(content);
    if (!result.ok) {
      return throwResultError(result.errors);
    }
    return await this.repository.update(articleId, {
      title: result.title,
      content,
    });
  }

  async getArticle(articleId: string): Promise<Article> {
    // if articleId's length is 16, it's legacy articleId, shorten it by first 6 characters
    if (articleId.length === 16) {
      articleId = articleId.slice(0, 6);
    }
    return await this.repository.getById(articleId);
  }

  async listReplies(articleId: string): Promise<ArticleCard[]> {
    return await this.repository.listReplies(articleId);
  }
}
