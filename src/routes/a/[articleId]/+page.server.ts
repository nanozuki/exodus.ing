import { fail, redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { PageServerLoad } from './$types';

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
  const user = locals.layouts.loggedInUser;
  const articleId = params.articleId!;
  const articleView = await locals.articlePage.getById(articleId, user || undefined);
  const commentForm = await superValidate(zod(commentSchema));
  const bookmarkForm = await superValidate(zod(bookmarkSchema), {
    defaults: {
      action: articleView.user?.isBookmarked ? 'remove' : 'add',
      articleId,
    },
  });
  return {
    ...articleView,
    commentForm,
    bookmarkForm,
  };
};

export const actions = {
  comment: async ({ locals, request, params }) => {
    const commentForm = await superValidate(request, zod(commentSchema));
    if (!commentForm.valid) {
      return fail(400, { commentForm });
    }
    const user = locals.layouts.requireLoggedInUser();
    const { action } = commentForm.data;
    if (action === 'new') {
      const commentId = await locals.articlePage.addComment({
        articleId: params.articleId!,
        userId: user.id,
        content: commentForm.data.content,
        replyTo: commentForm.data.replyTo,
      });
      redirect(303, `/a/${params.articleId}#comment-${commentId}`);
    }
    if (action === 'edit') {
      const commentId = commentForm.data.commentId!;
      await locals.articlePage.editComment({
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
    const user = locals.layouts.requireLoggedInUser();
    const { action, articleId } = bookmarkForm.data;
    if (action === 'add') {
      await locals.articlePage.addBookmark(articleId, user.id);
    }
    if (action === 'remove') {
      await locals.articlePage.removeBookmark(articleId, user.id);
    }
  },
} satisfies Actions;
