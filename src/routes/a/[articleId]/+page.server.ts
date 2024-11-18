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

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const user = locals.layouts.loggedInUser;
  const articleId = params.articleId!;
  const articleView = await locals.articlePage.getById(articleId, user || undefined);
  const focusComment = url.searchParams.get('comment');
  const commentForm = await superValidate(zod(commentSchema));
  return {
    ...articleView,
    commentForm,
    focusComment,
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
} satisfies Actions;
