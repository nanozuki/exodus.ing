import type { LoggedInUser } from '$lib/models/user';
import { throwError } from '$lib/errors';
import type { AppDatabase } from '$lib/server/db/schema';
import { getCommentById, createComment, updateComment } from '$lib/server/repositories/comment';

// On edits, the stored article and ancestry win over submitted replacements.
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
