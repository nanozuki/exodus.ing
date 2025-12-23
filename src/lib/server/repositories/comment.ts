import type { Comment, CommentInput, CommentListItem, CommentPatch } from '$lib/domain/entities/comment';
import { decodeIdPath, decodePathField, encodeIdPath } from '$lib/domain/values/id_path';
import { throwError } from '$lib/errors';
import { desc, eq, sql } from 'drizzle-orm/sql';
import { tArticle, tComment, tUser, type AppDatabase } from './schema';
import { newNanoId, wrap } from './utils';
import type { Paginated, Pagination } from '$lib/domain/values/page';

export class PgCommentRepository {
  constructor(private db: AppDatabase) {}

  private modelQuery() {
    return this.db
      .select({
        id: tComment.id,
        path: tComment.path,
        createdAt: tComment.createdAt,
        updatedAt: tComment.updatedAt,
        articleId: tComment.articleId,
        content: tComment.content,
        author: {
          id: tUser.id,
          username: tUser.username,
          name: tUser.name,
        },
      })
      .from(tComment)
      .innerJoin(tUser, eq(tComment.userId, tUser.id));
  }

  async listByArticle(articleId: string): Promise<Comment[]> {
    return await wrap('comment.listByArticleId', async () => {
      const comments = await this.modelQuery().where(eq(tComment.articleId, articleId)).orderBy(tComment.createdAt);
      return comments.map(decodePathField);
    });
  }

  async listByUser(userId: string, page: Pagination): Promise<Paginated<CommentListItem>> {
    return await wrap('comment.listByUser', async () => {
      const count = await this.db.$count(tComment, eq(tComment.userId, userId));
      const datas = await this.db
        .select({
          article: {
            id: tArticle.id,
            title: tArticle.title,
            authorId: tUser.id,
            authorUsername: tUser.username,
            authorName: tUser.name,
          },
          comment: {
            id: tComment.id,
            updatedAt: tComment.updatedAt,
            content: tComment.content,
          },
        })
        .from(tComment)
        .innerJoin(tArticle, eq(tArticle.id, tComment.articleId))
        .innerJoin(tUser, eq(tUser.id, tArticle.userId))
        .where(eq(tComment.userId, userId))
        .orderBy(desc(tComment.updatedAt))
        .limit(page.pageSize)
        .offset(page.pageSize * (page.pageNumber - 1));
      const items: CommentListItem[] = [];
      for (const data of datas) {
        const item = items.find((item) => item.article.id === data.article.id);
        if (item) {
          item.comments.push(data.comment);
        } else {
          items.push({ article: data.article, comments: [data.comment] });
        }
      }
      return {
        pageNumber: page.pageNumber,
        count,
        items,
      };
    });
  }

  async getById(commentId: string): Promise<Comment> {
    return await wrap('comment.getById', async () => {
      const comment = await this.modelQuery().where(eq(tComment.id, commentId));
      if (comment.length === 0) {
        return throwError('NOT_FOUND', { resource: '评论' });
      }
      return decodePathField(comment[0]);
    });
  }

  private async generateId(): Promise<string> {
    return await wrap('comment.generateId', async () => {
      let id = newNanoId();
      const count = async () => await this.db.$count(tComment, eq(tComment.id, id));
      while ((await count()) > 0) {
        id = newNanoId();
      }
      return id;
    });
  }

  async create(input: CommentInput): Promise<string> {
    return await wrap('comment.create', async () => {
      const id = await this.generateId();
      let path = [id];
      if (input.replyTo) {
        const replyTo = await this.db.select().from(tComment).where(eq(tComment.id, input.replyTo));
        if (replyTo.length === 0) {
          return throwError('NOT_FOUND', { resource: '回复的评论' });
        }
        path = [...decodeIdPath(replyTo[0].path), id];
      }
      const now = new Date();
      const comment = {
        ...input,
        id,
        path: encodeIdPath(path),
        createdAt: now,
        updatedAt: now,
      };
      await this.db.transaction(async (tx) => {
        await tx.insert(tComment).values(comment);
        await tx
          .update(tArticle)
          .set({ commentCount: sql`${tArticle.commentCount} + 1` })
          .where(eq(tArticle.id, input.articleId));
      });
      return comment.id;
    });
  }

  async update(commentId: string, patch: Partial<CommentPatch>): Promise<void> {
    await wrap('comment.update', () =>
      this.db.update(tComment).set({ content: patch.content, updatedAt: new Date() }).where(eq(tComment.id, commentId)),
    );
  }
}
