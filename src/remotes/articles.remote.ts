import { query } from '$app/server';
import { repositories } from '$lib/server/registry';
import { ARTICLE_PAGE_SIZE } from '$lib/domain/entities/article';
import z from 'zod';

export const listArticles = query(z.number().min(1), async (page) => {
  return await repositories.article.list({ pageNumber: page, pageSize: ARTICLE_PAGE_SIZE });
});
