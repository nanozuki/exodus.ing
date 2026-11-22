import { form, getRequestEvent, query } from '$app/server';
import { db } from '#lib/server/registry.js';
import { getBookmarkStateOfArticle, createBookmark, deleteBookmark } from '#lib/server/repositories/bookmark.js';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

/** Returns the article's bookmark count and the viewer's bookmark state; `bookmarked` is null for anonymous viewers. */
export const getArticleBookmarkStatus = query(z.string(), async (articleId) => {
  const { locals } = getRequestEvent();
  const user = locals.loggedInUser;
  return await getBookmarkStateOfArticle(db, { articleId, userId: user?.id });
});

/**
 * Adds or removes the viewer's bookmark on an article, refreshes `getArticleBookmarkStatus`, and returns
 * `success: true`. Anonymous submissions redirect 303 to `/auth?next=/a/<articleId>`.
 */
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
