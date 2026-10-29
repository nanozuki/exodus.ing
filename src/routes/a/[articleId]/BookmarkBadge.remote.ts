import { form, getRequestEvent, query } from '$app/server';
import { db } from '#lib/server/registry.js';
import { getBookmarkStateOfArticle, createBookmark, deleteBookmark } from '#lib/server/repositories/bookmark.js';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

export const getArticleBookmarkStatus = query(z.string(), async (articleId) => {
  const { locals } = getRequestEvent();
  const user = locals.loggedInUser;
  return await getBookmarkStateOfArticle(db, { articleId, userId: user?.id });
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
      await createBookmark(db, { articleId, userId: user.id });
    } else if (action === 'remove') {
      await deleteBookmark(db, { articleId, userId: user.id });
    }
    getArticleBookmarkStatus(articleId).refresh();
    return { success: true };
  },
);
