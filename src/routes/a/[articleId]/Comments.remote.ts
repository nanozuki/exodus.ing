import { form, getRequestEvent, query } from '$app/server';
import type { Comment } from '#lib/models/comment.js';
import { getCommentsOfArticle } from '#lib/server/repositories/comment.js';
import { saveComment } from '#lib/server/use-cases/comment.js';
import { db } from '#lib/server/registry.js';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

// A reply target is attached only when it occurs in the loaded discussion.
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
