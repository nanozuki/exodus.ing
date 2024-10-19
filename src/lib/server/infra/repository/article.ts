import type {
  Article,
  ArticleCard,
  ArticleInput,
  ArticleListItem,
  ArticlePatch,
  ArticleRepository,
} from '$lib/domain/entities/article';
import { decodeIdPath, encodeIdPath } from '$lib/domain/values/id_path';
import type { Paginated, Pagination } from '$lib/domain/values/page';
import { AppError } from '$lib/errors';
import { aliasedTable } from 'drizzle-orm';
import { and, desc, eq, like, ne, sql } from 'drizzle-orm/sql';
import { tArticle, tBookmark, tComment, tUser, type AppD1Database } from './schema';
import { newNanoId, wrap } from './utils';

type ArticleResult = Omit<Article, 'path'> & { path: string };

function convertModelToEntity(result: ArticleResult): Article {
  return {
    ...result,
    path: decodeIdPath(result.path),
  };
}

export class D1ArticleRepository implements ArticleRepository {
  constructor(private db: AppD1Database) {}

  private modelQuery() {
    const p = aliasedTable(tArticle, 'parent');
    const pu = aliasedTable(tUser, 'pu');
    return this.db
      .select({
        id: tArticle.id,
        path: tArticle.path,
        createdAt: tArticle.createdAt,
        updatedAt: tArticle.updatedAt,
        title: tArticle.title,
        authorUsername: tUser.username,
        authorName: tUser.name,
        contentType: tArticle.contentType,
        content: tArticle.content,
        replyTo: p.id ?? {
          id: p.id,
          title: p.title,
          authorUsername: pu.username,
          authorName: pu.name,
        },
        bookmarkCount: this.db.$count(tBookmark, eq(tBookmark.articleId, tArticle.id)),
      })
      .from(tArticle)
      .leftJoin(tUser, eq(tArticle.userId, tUser.id))
      .leftJoin(p, eq(sql`${p.path} || ${tArticle.id} || '/'`, tArticle.path))
      .leftJoin(pu, eq(p.userId, pu.id));
  }

  private listItemQuery() {
    const p = aliasedTable(tArticle, 'parent');
    const pu = aliasedTable(tUser, 'pu');
    return this.db
      .select({
        id: tArticle.id,
        createdAt: tArticle.createdAt,
        updatedAt: tArticle.updatedAt,
        title: tArticle.title,
        authorUsername: tUser.username,
        authorName: tUser.name,
        contentType: tArticle.contentType,
        replyTo: p.id ?? {
          id: p.id,
          title: p.title,
          authorUsername: pu.username,
          authorName: pu.name,
        },
        replyCount: this.db.$count(
          tArticle,
          and(ne(tArticle.id, p.id), like(tArticle.path, sql`${tArticle.path} || '%'`)),
        ),
        bookmarkCount: this.db.$count(tBookmark, eq(tBookmark.articleId, tArticle.id)),
        commentCount: this.db.$count(tComment, eq(tComment.articleId, tArticle.id)),
      })
      .from(tArticle)
      .leftJoin(tUser, eq(tArticle.userId, tUser.id))
      .leftJoin(p, eq(sql`${p.path} || ${tArticle.id} || '/'`, tArticle.path))
      .leftJoin(pu, eq(p.userId, pu.id));
  }

  private cardQuery() {
    return this.db
      .select({
        id: tArticle.id,
        title: tArticle.title,
        authorUsername: tUser.username,
        authorName: tUser.name,
      })
      .from(tArticle)
      .leftJoin(tUser, eq(tArticle.userId, tUser.id));
  }

  async getById(articleId: string): Promise<Article> {
    return await wrap('article.getById', async () => {
      const articles = await this.modelQuery().where(eq(tArticle.id, articleId));
      if (articles.length === 0) {
        return AppError.ArticleNotFound(articleId).throw();
      }
      return convertModelToEntity(articles[0]);
    });
  }

  async list(page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await wrap('article.list', async () => {
      console.log('page', page);
      const count = await this.db.$count(tArticle);
      const articles = await this.listItemQuery()
        .orderBy(desc(tArticle.createdAt))
        .limit(page.size)
        .offset(page.size * (page.number - 1));
      console.log('articles', articles);
      return {
        number: page.number,
        total: (count + page.size - 1) / page.size,
        items: articles as ArticleListItem[],
      };
    });
  }

  async listByUserId(userId: string, page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await wrap('article.listByUserId', async () => {
      const count = await this.db.$count(tArticle, eq(tArticle.userId, userId));
      const articles = await this.listItemQuery()
        .where(eq(tArticle.userId, userId))
        .orderBy(desc(tArticle.createdAt))
        .limit(page.size)
        .offset(page.size * (page.number - 1));
      return {
        number: page.number,
        total: (count + page.size - 1) / page.size,
        items: articles as ArticleListItem[],
      };
    });
  }

  async listReplies(articleId: string): Promise<ArticleCard[]> {
    return await wrap('article.listReplies', async () => {
      const articles = await this.cardQuery().where(
        and(ne(tArticle.id, articleId), like(tArticle.path, sql`${articleId} || '%'`)),
      );
      return articles as ArticleCard[];
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
