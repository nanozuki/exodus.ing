import { fail, redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { compileArticle, throwResultError } from '$lib/markdown';

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
  const user = locals.auth().loggedInUser;
  const articleId = params.articleId!;
  const [article, isBookmarked, comments, replies] = await Promise.all([
    locals.article().getById(articleId),
    user ? locals.bookmark().isBookmarked(articleId, user.id) : false,
    locals.comment().listByArticle(articleId),
    locals.article().listReplies(articleId),
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
  };
};

export const actions = {
  comment: async ({ locals, request, params }) => {
    const commentForm = await superValidate(request, zod(commentSchema));
    if (!commentForm.valid) {
      return fail(400, { commentForm });
    }
    const user = locals.auth().requireLoggedInUser();
    const { action } = commentForm.data;
    if (action === 'new') {
      const commentId = await locals.comment().create({
        articleId: params.articleId!,
        userId: user.id,
        content: commentForm.data.content,
        replyTo: commentForm.data.replyTo,
      });
      redirect(303, `/a/${params.articleId}#comment-${commentId}`);
    }
    if (action === 'edit') {
      const commentId = commentForm.data.commentId!;
      await locals.comment().update({
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
    const user = locals.auth().requireLoggedInUser();
    const { action, articleId } = bookmarkForm.data;
    if (action === 'add') {
      await locals.bookmark().addBookmark(articleId, user.id);
    }
    if (action === 'remove') {
      await locals.bookmark().removeBookmark(articleId, user.id);
    }
  },
} satisfies Actions;
