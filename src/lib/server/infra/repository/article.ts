import type {
  Article,
  ArticleInput,
  ArticleRepository,
  ArticlePatch,
} from '$lib/domain/entities/article';
import { and, desc, eq, like, ne } from 'drizzle-orm/sql';
import { tArticle, tUser, type ArticleModel, type AppD1Database, type UserModel } from './schema';
import { newNanoId, wrap } from './utils';
import { AppError } from '$lib/errors';
import { decodeIdPath, encodeIdPath, type IdPath } from '$lib/domain/values/id_path';
import type { Paginated, Pagination } from '$lib/domain/values/page';

function convertModelToEntity({
  article,
  user,
}: {
  article: ArticleModel;
  user: UserModel;
}): Article {
  return {
    ...article,
    path: decodeIdPath(article.path),
    author: { userId: user.id, username: user.username, name: user.name },
  };
}

export class D1ArticleRepository implements ArticleRepository {
  constructor(private db: AppD1Database) {}

  async getById(articleId: string): Promise<Article> {
    return await wrap('article.getById', async () => {
      const articles = await this.db
        .select()
        .from(tArticle)
        .innerJoin(tUser, eq(tArticle.userId, tUser.id))
        .where(eq(tArticle.id, articleId));
      if (articles.length === 0) {
        return AppError.ArticleNotFound(articleId).throw();
      }
      return convertModelToEntity(articles[0]);
    });
  }

  async list(page: Pagination): Promise<Paginated<Article>> {
    return await wrap('article.list', async () => {
      const articles = await this.db
        .select()
        .from(tArticle)
        .innerJoin(tUser, eq(tArticle.userId, tUser.id))
        .orderBy(desc(tArticle.createdAt))
        .limit(page.size)
        .offset(page.size * (page.number - 1));
      const totalArticles = await this.db.$count(tArticle);
      return {
        number: page.number,
        total: (totalArticles + page.size - 1) / page.size,
        items: articles.map(convertModelToEntity),
      };
    });
  }

  async listByUserId(userId: string, page: Pagination): Promise<Paginated<Article>> {
    return await wrap('article.listByUserId', async () => {
      const articles = await this.db
        .select()
        .from(tArticle)
        .innerJoin(tUser, eq(tArticle.userId, tUser.id))
        .where(eq(tArticle.userId, userId))
        .orderBy(desc(tArticle.createdAt))
        .limit(page.size)
        .offset(page.size * (page.number - 1));
      const totalArticles = await this.db.$count(tArticle, eq(tArticle.userId, userId));
      return {
        number: page.number,
        total: (totalArticles + page.size - 1) / page.size,
        items: articles.map(convertModelToEntity),
      };
    });
  }

  async getByPath(path: IdPath): Promise<Article | null> {
    return await wrap('article.getByPath', async () => {
      const articles = await this.db
        .select()
        .from(tArticle)
        .innerJoin(tUser, eq(tArticle.userId, tUser.id))
        .where(eq(tArticle.path, encodeIdPath(path)));
      if (articles.length === 0) {
        return null;
      }
      return convertModelToEntity(articles[0]);
    });
  }

  async listByPathPrefix(prefix: IdPath): Promise<Article[]> {
    return await wrap('article.listByPathPrefix', async () => {
      const pathStr = encodeIdPath(prefix);
      const articles = await this.db
        .select()
        .from(tArticle)
        .innerJoin(tUser, eq(tArticle.userId, tUser.id))
        .where(and(ne(tArticle.path, pathStr), like(tArticle.path, pathStr + '%')))
        .orderBy(desc(tArticle.createdAt));
      return articles.map(convertModelToEntity);
    });
  }

  private async generateId(): Promise<string> {
    return await wrap('article.generateId', async () => {
      let id = newNanoId();
      const count = () => this.db.$count(tArticle, eq(tArticle.id, id));
      while ((await count()) > 0) {
        id = newNanoId();
      }
      return id;
    });
  }

  async create(input: ArticleInput): Promise<string> {
    return await wrap('article.create', async () => {
      const articleId = await this.generateId();
      let path = [articleId];
      if (input.replyTo) {
        const parentArticle = await this.getById(input.replyTo);
        path = [...parentArticle.path, articleId];
      }
      const now = new Date();
      const article = {
        ...input,
        id: articleId,
        path: encodeIdPath(path),
        userId: input.userId,
        createdAt: now,
        updatedAt: now,
      };
      await this.db.insert(tArticle).values(article);
      return articleId;
    });
  }

  async update(articleId: string, patch: Partial<ArticlePatch>): Promise<void> {
    await wrap('article.update', () =>
      this.db.update(tArticle).set(patch).where(eq(tArticle.id, articleId)),
    );
  }
}
