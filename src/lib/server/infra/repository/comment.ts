import type {
  Comment,
  CommentInput,
  CommentPatch,
  CommentRepository,
} from '$lib/domain/entities/comment';
import { decodeIdPath, encodeIdPath } from '$lib/domain/values/id_path';
import { AppError } from '$lib/errors';
import { eq } from 'drizzle-orm/sql';
import { tComment, type AppD1Database, type CommentModel } from './schema';
import { newNanoId, wrap } from './utils';

function convertModelToEntity(model: CommentModel): Comment {
  return {
    ...model,
    path: decodeIdPath(model.path),
  };
}

export class D1CommentRepository implements CommentRepository {
  constructor(private db: AppD1Database) {}

  async listByArticle(articleId: string): Promise<Comment[]> {
    return await wrap('comment.listByArticleId', async () => {
      const comments = await this.db
        .select()
        .from(tComment)
        .where(eq(tComment.articleId, articleId))
        .orderBy(tComment.createdAt);
      return comments.map(convertModelToEntity);
    });
  }

  async getById(commentId: string): Promise<Comment> {
    return await wrap('comment.getById', async () => {
      const comment = await this.db.select().from(tComment).where(eq(tComment.id, commentId));
      if (comment.length === 0) {
        return AppError.CommentNotFound().throw();
      }
      return convertModelToEntity(comment[0]);
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
        path = [...replyTo[0].path, id];
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
    await wrap('comment.update', () =>
      this.db.update(tComment).set(patch).where(eq(tComment.id, commentId)),
    );
  }
}
