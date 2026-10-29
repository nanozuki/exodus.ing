import { query } from '$app/server';
import z from 'zod';
import { db } from '#lib/server/registry.js';
import { listArticles } from '#lib/server/repositories/article.js';

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
