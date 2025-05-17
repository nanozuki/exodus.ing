import type { Comment, CommentInput, CommentPatch, CommentRepository } from '$lib/domain/entities/comment';
import { decodeIdPath, decodePathField, encodeIdPath } from '$lib/domain/values/id_path';
import { AppError } from '$lib/errors';
import { eq } from 'drizzle-orm/sql';
import { tComment, tUser, type AppDatabase } from './schema';
import { newNanoId, wrap } from './utils';

export class SqliteCommentRepository implements CommentRepository {
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

  async getById(commentId: string): Promise<Comment> {
    return await wrap('comment.getById', async () => {
      const comment = await this.modelQuery().where(eq(tComment.id, commentId));
      if (comment.length === 0) {
        return AppError.CommentNotFound().throw();
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
          return AppError.CommentNotFound('replyTo').throw();
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
      await this.db.insert(tComment).values(comment);
      return comment.id;
    });
  }

  async update(commentId: string, patch: Partial<CommentPatch>): Promise<void> {
    await wrap('comment.update', () => this.db.update(tComment).set(patch).where(eq(tComment.id, commentId)));
  }
}
