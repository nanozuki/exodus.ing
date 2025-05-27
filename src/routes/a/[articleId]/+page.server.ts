import { fail, redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { compileArticle, throwResultError } from '$lib/markdown';
import { services } from '$lib/server/registry';
import { Permission } from '$lib/domain/entities/role';

const commentSchema = z.object({
  action: z.literal('new').or(z.literal('edit')),
  content: z.string().min(1, '不能为空'),
  replyTo: z.string().optional(),
  commentId: z.string().optional(),
});

const bookmarkSchema = z.object({
  action: z.literal('add').or(z.literal('remove')),
  articleId: z.string(),
});

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = locals.loggedInUser;
  const articleId = params.articleId!;
  const [article, isBookmarked, comments, replies, canReply] = await Promise.all([
    services.article.getById(articleId),
    user ? services.bookmark.isBookmarked(articleId, user.id) : false,
    services.comment.listByArticle(articleId),
    services.article.listReplies(articleId),
    locals.hasPermission(Permission.CreateArticle),
  ]);
  const commentForm = await superValidate(zod(commentSchema));
  const bookmarkForm = await superValidate(zod(bookmarkSchema), {
    defaults: {
      action: isBookmarked ? 'remove' : 'add',
      articleId,
    },
  });
  const result = await compileArticle(article.content);
  if (!result.ok) {
    return throwResultError(result.errors);
  }
  return {
    article: { ...article, content: result.value, title: result.title },
    isBookmarked,
    comments,
    replies,
    commentForm,
    bookmarkForm,
    canReply,
  };
};

export const actions = {
  comment: async ({ locals, request, params }) => {
    const commentForm = await superValidate(request, zod(commentSchema));
    if (!commentForm.valid) {
      return fail(400, { commentForm });
    }
    const user = locals.requireLoggedInUser('add or edit comment');
    const { action } = commentForm.data;
    if (action === 'new') {
      const commentId = await services.comment.create({
        articleId: params.articleId!,
        userId: user.id,
        content: commentForm.data.content,
        replyTo: commentForm.data.replyTo,
      });
      redirect(303, `/a/${params.articleId}#comment-${commentId}`);
    }
    if (action === 'edit') {
      const commentId = commentForm.data.commentId!;
      await services.comment.update({
        userId: user.id,
        commentId,
        content: commentForm.data.content,
      });
      redirect(303, `/a/${params.articleId}#comment-${commentId}`);
    }
  },
  bookmark: async ({ locals, request }) => {
    const bookmarkForm = await superValidate(request, zod(bookmarkSchema));
    if (!bookmarkForm.valid) {
      return fail(400, { bookmarkForm });
    }
    const user = locals.requireLoggedInUser('add or delete bookmark');
    const { action, articleId } = bookmarkForm.data;
    if (action === 'add') {
      await services.bookmark.addBookmark(articleId, user.id);
    }
    if (action === 'remove') {
      await services.bookmark.removeBookmark(articleId, user.id);
    }
  },
} satisfies Actions;
