import type {
  Article,
  ArticleCard,
  ArticleContent,
  ArticleFeedsItem,
  ArticleInput,
  ArticleListItem,
  ArticlePatch,
} from '$lib/domain/entities/article';
import {
  decodePathField,
  encodeIdPath,
  getPathParent,
  type IdPath,
  type PathEncoded,
} from '$lib/domain/values/id_path';
import type { Paginated, Pagination } from '$lib/domain/values/page';
import { throwError } from '$lib/errors';
import { and, desc, eq, inArray, like, ne, sql } from 'drizzle-orm/sql';
import { tArticle, tBookmark, tUser, type AppDatabase } from './schema';
import { newNanoId, wrap } from './utils';

interface WaitReplyToArticle extends ArticleCard {
  path: IdPath;
  replyTo?: ArticleCard;
}

export class PgArticleRepository {
  constructor(private db: AppDatabase) {}

  private selectCard = {
    id: tArticle.id,
    title: tArticle.title,
    authorId: tArticle.userId,
    authorUsername: tUser.username,
    authorName: tUser.name,
  };
  private selectListItem = {
    ...this.selectCard,
    path: tArticle.path,
    createdAt: tArticle.createdAt,
    updatedAt: tArticle.updatedAt,
    contentType: tArticle.contentType,
    replyCount: tArticle.replyCount,
    bookmarkCount: tArticle.bookmarkCount,
    commentCount: tArticle.commentCount,
  };
  private selectModel = {
    ...this.selectListItem,
    content: tArticle.content,
  };

  private modelQuery() {
    return this.db.select(this.selectModel).from(tArticle).innerJoin(tUser, eq(tArticle.userId, tUser.id)).$dynamic();
  }

  private listItemQuery(page: Pagination) {
    return this.db
      .select(this.selectListItem)
      .from(tArticle)
      .innerJoin(tUser, eq(tArticle.userId, tUser.id))
      .orderBy(desc(tArticle.createdAt))
      .limit(page.pageSize)
      .offset(page.pageSize * (page.pageNumber - 1))
      .$dynamic();
  }

  private cardQuery() {
    return this.db.select(this.selectCard).from(tArticle).innerJoin(tUser, eq(tArticle.userId, tUser.id)).$dynamic();
  }

  private async populateReplyTo(articles: WaitReplyToArticle[]) {
    const datas = new Map<string, WaitReplyToArticle>();
    const wantedIdSet = new Set<string>();
    for (const article of articles) {
      datas.set(article.id, article);
      const pathDepth = article.path.length;
      if (pathDepth > 1) {
        wantedIdSet.add(article.path[pathDepth - 2]);
      }
    }
    const wantedIds = Array.from(wantedIdSet);
    const cards = await this.cardQuery().where(inArray(tArticle.id, wantedIds));
    const replyToMap = new Map<string, ArticleCard>();
    for (const card of cards) {
      replyToMap.set(card.id, card);
    }
    for (const article of articles) {
      const parentId = getPathParent(article.path);
      if (parentId) {
        article.replyTo = replyToMap.get(parentId);
        if (!article.replyTo) {
          throwError('INTERNAL_SERVER_ERROR', `Can't find artile ${article.id}'s replyTo ${parentId}`);
        }
      }
    }
  }

  async getById(articleId: string): Promise<Article> {
    return await wrap('article.getById', async () => {
      const rows: PathEncoded<Article>[] = await this.modelQuery().where(eq(tArticle.id, articleId));
      const articles = rows.map(decodePathField);
      if (articles.length === 0) {
        return throwError('NOT_FOUND', { resource: '文章' });
      }
      await this.populateReplyTo(articles);
      return articles[0];
    });
  }

  async getContentById(articleId: string): Promise<ArticleContent> {
    return await wrap('article.getContentById', async () => {
      const rows = await this.db
        .select({
          id: tArticle.id,
          title: tArticle.title,
          content: tArticle.content,
          contentType: tArticle.contentType,
        })
        .from(tArticle)
        .where(eq(tArticle.id, articleId));
      if (rows.length === 0) {
        return throwError('NOT_FOUND', { resource: '文章' });
      }
      return rows[0];
    });
  }

  async getCardById(articleId: string): Promise<ArticleCard> {
    return await wrap('article.getCardById', async () => {
      const rows = await this.cardQuery().where(eq(tArticle.id, articleId));
      if (rows.length === 0) {
        return throwError('NOT_FOUND', { resource: '文章' });
      }
      return rows[0];
    });
  }

  async list(page: Pagination): Promise<Paginated<ArticleListItem>> {
    return await wrap('article.list', async () => {
      const count = await this.db.$count(tArticle);
      const rows = await this.listItemQuery(page);
      const articles = rows.map(decodePathField);
      await this.populateReplyTo(articles as WaitReplyToArticle[]);
      return {
        pageNumber: page.pageNumber,
        count,
        items: articles,
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
      const rows = await this.listItemQuery(page).where(eq(tArticle.userId, userId));
      const articles = rows.map(decodePathField);
      await this.populateReplyTo(articles as WaitReplyToArticle[]);
      return {
        pageNumber: page.pageNumber,
        count,
        items: articles,
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
      const rows = await this.listItemQuery(page)
        .innerJoin(tBookmark, eq(tArticle.id, tBookmark.articleId))
        .where(eq(tBookmark.userId, userId));
      const articles = rows.map(decodePathField);
      await this.populateReplyTo(articles);
      return {
        pageNumber: page.pageNumber,
        count,
        items: articles,
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
        userId: input.authorId,
        createdAt: now,
        updatedAt: now,
      };
      await this.db.transaction(async (tx) => {
        if (input.replyTo) {
          await tx
            .update(tArticle)
            .set({
              replyCount: sql`${tArticle.replyCount} + 1`,
            })
            .where(eq(tArticle.id, input.replyTo));
        }
        await tx.insert(tArticle).values(article);
      });
      return articleId;
    });
  }

  async update(articleId: string, patch: Partial<ArticlePatch>): Promise<void> {
    await wrap('article.update', () => this.db.update(tArticle).set(patch).where(eq(tArticle.id, articleId)));
  }
}
