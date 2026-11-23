import type { LoggedInUser } from '#lib/models/user.js';
import { throwError } from '#lib/errors.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import { getCommentById, createComment, updateComment } from '#lib/server/repositories/comment.js';

/**
 * With `commentId`, updates the content of the actor's own comment; another author's comment throws BAD_REQUEST, and
 * the stored article and parent win over submitted `articleId` and `replyToId`. Without it, creates the actor's
 * comment on `articleId` (BAD_REQUEST when absent), replying to `replyToId` when given. Returns the identifiers the
 * caller refreshes and redirects with. `content` is stored as given; the caller rejects empty input.
 */
export async function saveComment(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; articleId?: string; content: string; commentId?: string; replyToId?: string },
): Promise<{ articleId: string; commentId: string }> {
  if (params.commentId) {
    const comment = await getCommentById(deps.db, params.commentId);
    if (comment.author.id !== params.actor.id) return throwError('BAD_REQUEST', '只能编辑自己的评论');
    await updateComment(deps.db, { id: comment.id, content: params.content });
    return { articleId: comment.articleId, commentId: comment.id };
  }
  if (!params.articleId) return throwError('BAD_REQUEST', '缺少文章ID');
  const comment = await createComment(deps.db, {
    articleId: params.articleId,
    userId: params.actor.id,
    content: params.content,
    replyToId: params.replyToId,
  });
  return { articleId: comment.articleId, commentId: comment.id };
}
