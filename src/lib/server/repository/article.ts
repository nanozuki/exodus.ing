import type { Article, ArticleInput, ArticleRepository, ArticlePatch } from '$lib/domain/article';
import { desc, eq } from 'drizzle-orm/sql';
import { tArticle, tUser, type ArticleModel, type AppD1Database, type UserModel } from './schema';
import { newNanoId, wrap } from './utils';
import { AppError } from '$lib/errors';

function convertModelToEntity({
  article,
  user,
}: {
  article: ArticleModel;
  user: UserModel;
}): Article {
  return {
    ...article,
    author: { userId: user.id, username: user.username, name: user.name },
  };
}

export class D1ArticleRepository implements ArticleRepository {
  constructor(private db: AppD1Database) {}

  async getById(articleId: string): Promise<Article> {
    const articles = await wrap(
      async () =>
        await this.db
          .select()
          .from(tArticle)
          .innerJoin(tUser, eq(tArticle.userId, tUser.id))
          .where(eq(tArticle.id, articleId)),
    );
    if (articles.length === 0) {
      return AppError.ArticleNotFound(articleId).throw();
    }
    const { article, user } = articles[0];
    return convertModelToEntity({ article, user });
  }

  async list(limit: number, offset: number): Promise<Article[]> {
    const articles = await wrap(
      async () =>
        await this.db
          .select()
          .from(tArticle)
          .innerJoin(tUser, eq(tArticle.userId, tUser.id))
          .orderBy(desc(tArticle.createdAt))
          .limit(limit)
          .offset(offset),
    );
    return articles.map(convertModelToEntity);
  }

  async listByUserId(userId: string, limit: number, offset: number): Promise<Article[]> {
    const articles = await wrap(
      async () =>
        await this.db
          .select()
          .from(tArticle)
          .innerJoin(tUser, eq(tArticle.userId, tUser.id))
          .where(eq(tArticle.userId, userId))
          .orderBy(desc(tArticle.createdAt))
          .limit(limit)
          .offset(offset),
    );
    return articles.map(convertModelToEntity);
  }

  async generateId(): Promise<string> {
    let id = newNanoId();
    const count = async () =>
      await wrap(
        async () => (await this.db.select().from(tArticle).where(eq(tArticle.id, id))).length,
      );
    while ((await count()) > 0) {
      // try again if the id is already in use
      id = newNanoId();
    }
    return id;
  }

  async create(article: ArticleInput): Promise<void> {
    await wrap(async () => await this.db.insert(tArticle).values(article));
  }

  async update(articleId: string, patch: Partial<ArticlePatch>): Promise<void> {
    await wrap(
      async () => await this.db.update(tArticle).set(patch).where(eq(tArticle.id, articleId)),
    );
  }
}
