import { form, getRequestEvent, query } from '$app/server';
import type { Comment } from '#lib/models/comment.js';
import { getCommentsOfArticle } from '#lib/server/repositories/comment.js';
import { saveComment } from '#lib/server/use-cases/comment.js';
import { db } from '#lib/server/registry.js';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

/** A comment with its direct reply target, attached only when the target is among the article's loaded comments. */
export type CommentView = Comment & { replyTo?: Comment };

function commentViews(comments: Comment[]): CommentView[] {
  const map = new Map<string, Comment>();
  for (const comment of comments) {
    map.set(comment.id, comment);
  }
  const views: CommentView[] = [];
  for (const comment of comments) {
    if (comment.path.length === 1) {
      views.push(comment);
    } else {
      const replyTo = map.get(comment.path[comment.path.length - 2]);
      views.push({ ...comment, replyTo });
    }
  }
  return views;
}

/** Lists all comments of an article in creation order. */
export const listCommentsOfArticle = query(z.string(), async (articleId) => {
  const comments = await getCommentsOfArticle(db, articleId);
  return commentViews(comments);
});

const postCommentSchema = z.object({
  articleId: z.string().optional(),
  content: z.string().min(1, '评论内容不能为空'),
  commentId: z.string().optional(),
  replyToId: z.string().optional(),
});

/**
 * Creates or edits a comment through `saveComment`, which owns ownership checks and persistence. Requires a signed-in
 * viewer and nonempty content. On success, refreshes `listCommentsOfArticle` and redirects 303 to
 * `/a/<articleId>#comment-<commentId>`.
 */
export const postComment = form(postCommentSchema, async ({ articleId, content, commentId, replyToId }) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('post comment');
  const { articleId: articleIdResult, commentId: commentIdResult } = await saveComment(
    { db },
    { actor: user, articleId, content, commentId, replyToId },
  );
  listCommentsOfArticle(articleIdResult).refresh();
  redirect(303, `/a/${articleIdResult}#comment-${commentIdResult}`);
});
