import type { Article, ArticleCard, ArticleContent, ArticleRepository } from '$lib/domain/entities/article';
import { compileArticle } from '$lib/markdown';
import { throwError } from '$lib/errors';

export class ArticleService {
  constructor(private repository: ArticleRepository) {}

  async getById(articleId: string): Promise<Article> {
    return await this.repository.getById(articleId);
  }

  async getContentById(articleId: string): Promise<ArticleContent> {
    return await this.repository.getContentById(articleId);
  }

  async getCardById(articleId: string): Promise<ArticleCard> {
    return await this.repository.getCardById(articleId);
  }

  async createByMarkdown(userId: string, content: string, replyTo?: string): Promise<string> {
    const result = await compileArticle(content);
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
      return throwError('BAD_REQUEST', '只能编辑自己的文章');
    }
    const result = await compileArticle(content);
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
