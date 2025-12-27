import { form, getRequestEvent, query } from '$app/server';
import { COMMENT_PAGE_SIZE, type Comment, type CommentView } from '$lib/domain/entities/comment';
import { throwError } from '$lib/errors';
import { repositories } from '$lib/server/registry';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

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
  const comments = await repositories.comment.listByArticle(articleId);
  return commentViews(comments);
});

export const listCommentsOfUser = query(
  z.object({
    userId: z.string(),
    page: z.number().default(1),
  }),
  async ({ userId, page }) => {
    return await repositories.comment.listByUser(userId, { pageNumber: page, pageSize: COMMENT_PAGE_SIZE });
  },
);

const addCommentSchema = z.object({
  articleId: z.string(),
  content: z.string().min(1, '评论内容不能为空'),
  replyTo: z.string().optional(),
});

export const addComment = form(addCommentSchema, async (data) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('add comment');
  const commentId = await repositories.comment.create({
    userId: user.id,
    ...data,
  });
  listCommentsOfArticle(data.articleId).refresh();
  redirect(303, `/a/${data.articleId}#comment-${commentId}`);
});

const editCommentSchema = z.object({
  commentId: z.string(),
  content: z.string().min(1, '评论内容不能为空'),
});

export const editComment = form(editCommentSchema, async ({ commentId, content }) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('edit comment');
  const comment = await repositories.comment.getById(commentId);
  if (comment.author.id !== user.id) {
    return throwError('BAD_REQUEST', '只能编辑自己的评论');
  }
  await repositories.comment.update(commentId, { content: content });
  listCommentsOfArticle(comment.articleId).refresh();
  redirect(303, `/a/${comment.articleId}#comment-${commentId}`);
});
