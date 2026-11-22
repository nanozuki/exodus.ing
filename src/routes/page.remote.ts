import { query } from '$app/server';
import z from 'zod';
import { db } from '#lib/server/registry.js';
import { listArticles } from '#lib/server/repositories/article.js';

/**
 * Loads one homepage page of 20 articles. `page` is read with `parseInt`; absent, invalid, or zero values mean page 1,
 * and negative values fail validation. Returns the effective page with its articles.
 */
export const loadPageData = query(
  z.object({
    page: z
      .string()
      .nullable()
      .transform((value) => parseInt(value || '1') || 1)
      .pipe(z.number().min(1)),
  }),
  async ({ page }) => {
    const pageSize = 20;
    return { page, articles: await listArticles(db, { pageNumber: page, pageSize }) };
  },
);
