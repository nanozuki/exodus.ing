import { form, getRequestEvent, query } from '$app/server';
import { repositories } from '$lib/server/registry';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

export const getArticleBookmarkStatus = query(z.string(), async (articleId) => {
  const { locals } = getRequestEvent();
  const user = locals.loggedInUser;
  return repositories.bookmark.getBookmarkStatus(articleId, user?.id);
});

export const operateArticleBookmark = form(
  z.object({
    action: z.literal(['add', 'remove']),
    articleId: z.string(),
  }),
  async ({ action, articleId }) => {
    const { locals } = getRequestEvent();
    const user = locals.loggedInUser;
    if (!user) {
      redirect(303, `/auth?next=/a/${articleId}`);
    }
    if (action === 'add') {
      await repositories.bookmark.create(articleId, user.id);
    } else if (action === 'remove') {
      await repositories.bookmark.delete(articleId, user.id);
    }
    getArticleBookmarkStatus(articleId).refresh();
    return { success: true };
  },
);
