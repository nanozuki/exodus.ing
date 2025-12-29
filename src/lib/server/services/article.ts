import type { Article, ArticleCard, ArticleContent } from '$lib/domain/entities/article';
import { compileArticle, throwArticleIssue } from '$lib/markdown';
import { throwError } from '$lib/errors';
import { repositories } from '$lib/server/registry';

export class ArticleService {
  constructor() {}

  async getContentById(articleId: string): Promise<ArticleContent> {
    return await repositories.article.getContentById(articleId);
  }

  async getCardById(articleId: string): Promise<ArticleCard> {
    return await repositories.article.getCardById(articleId);
  }

  async createByMarkdown(userId: string, content: string, replyTo?: string): Promise<string> {
    const result = await compileArticle(content);
    if (result.issues.length > 0) {
      return throwArticleIssue(result.issues[0], 'content');
    }
    return await repositories.article.create({
      authorId: userId,
      content,
      title: result.title,
      contentType: 'markdown',
      replyTo,
    });
  }

  async updateByMarkdown(userId: string, articleId: string, content: string): Promise<void> {
    const article = await repositories.article.getById(articleId);
    if (article.authorId !== userId) {
      return throwError('BAD_REQUEST', '只能编辑自己的文章');
    }
    const result = await compileArticle(content);
    if (result.issues.length > 0) {
      return throwArticleIssue(result.issues[0], 'content');
    }
    return await repositories.article.update(articleId, {
      title: result.title,
      content,
    });
  }

  async getArticle(articleId: string): Promise<Article> {
    // if articleId's length is 16, it's legacy articleId, shorten it by first 6 characters
    if (articleId.length === 16) {
      articleId = articleId.slice(0, 6);
    }
    return await repositories.article.getById(articleId);
  }

  async listReplies(articleId: string): Promise<ArticleCard[]> {
    return await repositories.article.listReplies(articleId);
  }
}
