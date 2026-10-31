import type { Comment, CommentListItem } from '#lib/models/comment.js';
import { decodeIdPath, decodePathField, encodeIdPath } from '#lib/models/id_path.js';
import type { Pagination, Paginated } from '#lib/models/page.js';
import { throwError } from '#lib/errors.js';
import { desc, eq, sql } from 'drizzle-orm';
import { tArticle, tComment, tUser, type AppDatabase } from '#lib/server/db/schema.js';
import { newNanoId, wrap } from './utils';

type QueryDatabase = Pick<AppDatabase, 'select'>;

const author = { id: tUser.id, username: tUser.username, name: tUser.name };

function query(db: QueryDatabase) {
  return db
    .select({
      id: tComment.id,
      path: tComment.path,
      createdAt: tComment.createdAt,
      updatedAt: tComment.updatedAt,
      articleId: tComment.articleId,
      content: tComment.content,
      author,
    })
    .from(tComment)
    .innerJoin(tUser, eq(tComment.userId, tUser.id));
}

async function readComment(db: QueryDatabase, id: string): Promise<Comment> {
  const [row] = await query(db).where(eq(tComment.id, id));
  return row ? decodePathField(row) : throwError('NOT_FOUND', { resource: '评论' });
}

export async function getCommentsOfArticle(db: AppDatabase, articleId: string): Promise<Comment[]> {
  return wrap('getCommentsOfArticle', async () =>
    (await query(db).where(eq(tComment.articleId, articleId)).orderBy(tComment.createdAt)).map(decodePathField),
  );
}

export async function listCommentsOfUser(
  db: AppDatabase,
  userId: string,
  page: Pagination,
): Promise<Paginated<CommentListItem>> {
  return wrap('listCommentsOfUser', () =>
    db.transaction(
      async (tx) => {
        const count = await tx.$count(tComment, eq(tComment.userId, userId));
        const rows = await tx
          .select({
            articleId: tArticle.id,
            title: tArticle.title,
            author,
            comment: { id: tComment.id, updatedAt: tComment.updatedAt, content: tComment.content },
          })
          .from(tComment)
          .innerJoin(tArticle, eq(tArticle.id, tComment.articleId))
          .innerJoin(tUser, eq(tUser.id, tArticle.userId))
          .where(eq(tComment.userId, userId))
          .orderBy(desc(tComment.updatedAt))
          .limit(page.pageSize)
          .offset((page.pageNumber - 1) * page.pageSize);
        const items: CommentListItem[] = [];
        for (const row of rows) {
          const group = items.find((item) => item.article.id === row.articleId);
          if (group) group.comments.push(row.comment);
          else
            items.push({
              article: { id: row.articleId, title: row.title, author: row.author },
              comments: [row.comment],
            });
        }
        return { ...page, count, items };
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    ),
  );
}

export async function getCommentById(db: AppDatabase, commentId: string): Promise<Comment> {
  return wrap('getCommentById', () => readComment(db, commentId));
}

export interface CreateCommentParams {
  articleId: string;
  userId: string;
  content: string;
  replyToId?: string;
}

export async function createComment(db: AppDatabase, params: CreateCommentParams): Promise<Comment> {
  return wrap('createComment', () =>
    db.transaction(async (tx) => {
      let id = newNanoId();
      while (await tx.$count(tComment, eq(tComment.id, id))) id = newNanoId();
      let path = [id];
      if (params.replyToId) {
        const [parent] = await tx.select().from(tComment).where(eq(tComment.id, params.replyToId));
        if (!parent) return throwError('NOT_FOUND', { resource: '回复的评论' });
        path = [...decodeIdPath(parent.path), id];
      }
      const now = new Date();
      await tx.insert(tComment).values({
        id,
        userId: params.userId,
        articleId: params.articleId,
        content: params.content,
        path: encodeIdPath(path),
        createdAt: now,
        updatedAt: now,
      });
      const [article] = await tx
        .update(tArticle)
        .set({ commentCount: sql`${tArticle.commentCount} + 1` })
        .where(eq(tArticle.id, params.articleId))
        .returning({ id: tArticle.id });
      if (!article) return throwError('NOT_FOUND', { resource: '文章' });
      // Resolve the author before commit so mapping failures roll back the write and counter.
      return readComment(tx, id);
    }),
  );
}

export interface UpdateCommentParams {
  id: string;
  content?: string;
}

export async function updateComment(db: AppDatabase, { id, content }: UpdateCommentParams): Promise<void> {
  return wrap('updateComment', async () => {
    await db.update(tComment).set({ content, updatedAt: new Date() }).where(eq(tComment.id, id));
  });
}
