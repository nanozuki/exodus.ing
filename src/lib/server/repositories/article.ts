import type {
  Article,
  ArticleCard,
  ArticleEditorData,
  ArticleInput,
  ArticleListItem,
  ArticleFeedsItem,
  ArticlePatch,
  ArticleRepository,
} from '$lib/domain/entities/article';
import { decodePathField, encodeIdPath } from '$lib/domain/values/id_path';
import type { Paginated, Pagination } from '$lib/domain/values/page';
import { AppError } from '$lib/errors';
import { aliasedTable } from 'drizzle-orm';
import { and, desc, eq, like, ne, sql } from 'drizzle-orm/sql';
import { tArticle, tBookmark, tComment, tUser, type AppDatabase } from './schema';
import { newNanoId, wrap } from './utils';

type ReplyToModel = ArticleCard | { id: null; title: null; authorId: null; authorUsername: null; authorName: null };
type ArticleResult = Omit<Article, 'path' | 'replyTo'> & { path: string; replyTo: ReplyToModel };
type ArticleItemResult = Omit<ArticleListItem, 'replyTo'> & { replyTo: ReplyToModel };

function convertReplyTo<T extends { replyTo: ReplyToModel }>(item: T): Omit<T, 'replyTo'> & { replyTo?: ArticleCard } {
  return { ...item, replyTo: item.replyTo.id ? item.replyTo : undefined };
}

export class D1ArticleRepository implements ArticleRepository {
  constructor(private db: AppDatabase) {}

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
        authorId: tArticle.userId,
        authorUsername: tUser.username,
        authorName: tUser.name,
        contentType: tArticle.contentType,
        content: tArticle.content,
        replyTo: {
          id: p.id,
          title: p.title,
          authorId: p.userId,
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
    const r = aliasedTable(tArticle, 'r');
    const replies = this.db.$with('replies').as(
      this.db
        .select({
          id: tArticle.id,
          replyCount: sql<number>`COALESCE(COUNT(r.id), 0)`.as('reply_count'),
        })
        .from(tArticle)
        .leftJoin(r, and(ne(tArticle.id, r.id), eq(sql`${tArticle.path} || ${r.id} || '/'`, r.path)))
        .groupBy(tArticle.id),
    );
    return this.db
      .with(replies)
      .select({
        id: tArticle.id,
        createdAt: tArticle.createdAt,
        updatedAt: tArticle.updatedAt,
        title: tArticle.title,
        authorId: tArticle.userId,
        authorUsername: tUser.username,
        authorName: tUser.name,
        contentType: tArticle.contentType,
        replyTo: {
          id: p.id,
          title: p.title,
          authorId: p.userId,
          authorUsername: pu.username,
          authorName: pu.name,
        },
        replyCount: replies.replyCount,
        bookmarkCount: this.db.$count(tBookmark, eq(tBookmark.articleId, tArticle.id)),
        commentCount: this.db.$count(tComment, eq(tComment.articleId, tArticle.id)),
      })
      .from(tArticle)
      .leftJoin(tUser, eq(tArticle.userId, tUser.id))
      .leftJoin(p, eq(sql`${p.path} || ${tArticle.id} || '/'`, tArticle.path))
      .leftJoin(pu, eq(p.userId, pu.id))
      .leftJoin(replies, eq(tArticle.id, replies.id));
  }

  private cardQuery() {
    return this.db
      .select({
        id: tArticle.id,
        title: tArticle.title,
        authorId: tArticle.userId,
        authorUsername: tUser.username,
        authorName: tUser.name,
      })
      .from(tArticle)
      .innerJoin(tUser, eq(tArticle.userId, tUser.id));
  }

  async getById(articleId: string): Promise<Article> {
    return await wrap('article.getById', async () => {
      const articles = await this.modelQuery().where(eq(tArticle.id, articleId));
      if (articles.length === 0) {
        return AppError.ArticleNotFound(articleId).throw();
      }
      return convertReplyTo(decodePathField(articles[0] as ArticleResult));
    });
  }

  async getArticleEditorData(req: { articleId?: string; replyTo?: string }): Promise<ArticleEditorData> {
    const getArticle = async () => {
      if (!req.articleId) {
        return undefined;
      }
      const rows = await this.db
        .select({
          title: tArticle.title,
          content: tArticle.content,
        })
        .from(tArticle)
        .where(eq(tArticle.id, req.articleId));
      return rows.length > 0 ? rows[0] : undefined;
    };
    const getReplyTo = async () => {
      if (!req.replyTo) {
        return undefined;
      }
      const rows = await this.cardQuery().where(eq(tArticle.id, req.replyTo));
      return rows.length > 0 ? rows[0] : undefined;
    };
    const [article, replyTo] = await Promise.all([getArticle(), getReplyTo()]);
    return { article, replyTo };
  }

  async list(page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await wrap('article.list', async () => {
      const count = await this.db.$count(tArticle);
      const articles = await this.listItemQuery()
        .orderBy(desc(tArticle.createdAt))
        .limit(page.pageSize)
        .offset(page.pageSize * (page.pageNumber - 1));
      return {
        pageNumber: page.pageNumber,
        count,
        items: (articles as ArticleItemResult[]).map(convertReplyTo),
      };
    });
  }

  async listFeeds(last: number): Promise<ArticleFeedsItem[]> {
    return await wrap('article.listFeeds', async () => {
      const articles = await this.db
        .select({
          id: tArticle.id,
          createdAt: tArticle.createdAt,
          updatedAt: tArticle.updatedAt,
          title: tArticle.title,
          authorName: tUser.name,
          authorUsername: tUser.username,
          contentType: tArticle.contentType,
          content: tArticle.content,
        })
        .from(tArticle)
        .innerJoin(tUser, eq(tArticle.userId, tUser.id))
        .orderBy(desc(tArticle.updatedAt))
        .limit(last);
      return articles;
    });
  }

  async listByUserId(userId: string, page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await wrap('article.listByUserId', async () => {
      const count = await this.db.$count(tArticle, eq(tArticle.userId, userId));
      const articles = await this.listItemQuery()
        .where(eq(tArticle.userId, userId))
        .orderBy(desc(tArticle.createdAt))
        .limit(page.pageSize)
        .offset(page.pageSize * (page.pageNumber - 1));
      return {
        pageNumber: page.pageNumber,
        count,
        items: (articles as ArticleItemResult[]).map(convertReplyTo),
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

  async listUserBookmarks(userId: string, page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await wrap('article.listUserBookmarks', async () => {
      const count = await this.db.$count(tBookmark, eq(tBookmark.userId, userId));
      const articles = await this.listItemQuery()
        .innerJoin(tBookmark, eq(tArticle.id, tBookmark.articleId))
        .where(eq(tBookmark.userId, userId))
        .orderBy(desc(tBookmark.createdAt))
        .limit(page.pageSize)
        .offset(page.pageSize * (page.pageNumber - 1));
      return {
        pageNumber: page.pageNumber,
        count,
        items: (articles as ArticleItemResult[]).map(convertReplyTo),
      };
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
    await wrap('article.update', () => this.db.update(tArticle).set(patch).where(eq(tArticle.id, articleId)));
  }
}
