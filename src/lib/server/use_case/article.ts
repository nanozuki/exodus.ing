import type { Article } from '$lib/domain/article';
import { AppError } from '$lib/errors';
import type { Context } from '$lib/server/context';

export class ArticleUseCase {
  constructor(private ctx: Context) {}

  async createMarkdownArticle(title: string, content: string): Promise<string> {
    const { id: userId } = this.ctx.auth.requireLoggedInUser();
    const id = await this.ctx.article.generateId();
    const now = this.ctx.clock.now();
    await this.ctx.article.create({
      id,
      createdAt: now,
      updatedAt: now,
      userId,
      title,
      content,
      contentType: 'markdown',
    });
    return id;
  }

  async createExternalLinkArticle(
    title: string,
    url: string,
    publishedAt: Date,
    editedAt: Date,
  ): Promise<string> {
    const { id: userId } = this.ctx.auth.requireLoggedInUser();
    const domain = new URL(url).hostname;
    const userDomain = await this.ctx.userDomain.findUserDomain(userId, domain);
    if (!userDomain || !userDomain.verifiedAt) {
      return AppError.Forbidden('create article').throw();
    }
    const id = await this.ctx.article.generateId();
    await this.ctx.article.create({
      id: id,
      createdAt: publishedAt,
      updatedAt: editedAt,
      userId,
      title,
      contentType: 'external_link',
      content: url,
    });
    return id;
  }

  async updateMarkdownArticle(articleId: string, title: string, content: string): Promise<void> {
    const { id: authorId } = this.ctx.auth.requireLoggedInUser();
    const article = await this.ctx.article.getById(articleId);
    if (article.author.userId !== authorId) {
      return AppError.Forbidden('update article').throw();
    }
    await this.ctx.article.update(articleId, {
      title,
      content,
      updatedAt: this.ctx.clock.now(),
    });
  }

  async listArticles(limit: number, offset: number): Promise<Article[]> {
    return await this.ctx.article.list(limit, offset);
  }

  async listArticlesByUserId(userId: string, limit: number, offset: number): Promise<Article[]> {
    return await this.ctx.article.listByUserId(userId, limit, offset);
  }

  async getArticle(articleId: string): Promise<Article> {
    // if articleId's length is 16, it's legacy articleId, shorten it by first 6 characters
    if (articleId.length === 16) {
      articleId = articleId.slice(0, 6);
    }
    return await this.ctx.article.getById(articleId);
  }
}
