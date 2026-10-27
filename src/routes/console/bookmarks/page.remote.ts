import { query, getRequestEvent } from '$app/server';
import z from 'zod';
import { db } from '$lib/server/registry';
import { listBookmarkedArticlesOfUser } from '$lib/server/repositories/article';

export const loadPageData = query(z.object({ page: z.number().min(1) }), async ({ page }) => {
  const user = getRequestEvent().locals.requireLoggedInUser('console bookmarks');
  const pageSize = 20;
  return { articles: await listBookmarkedArticlesOfUser(db, user.id, { pageNumber: page, pageSize }) };
});
