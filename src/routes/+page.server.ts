import { repositories } from '$lib/server/registry';
import type { PageServerLoad } from './$types';
import { ARTICLE_PAGE_SIZE } from '$lib/domain/entities/article';

export const load: PageServerLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1') || 1;
  const data = await repositories.article.list({ pageNumber: page, pageSize: ARTICLE_PAGE_SIZE });
  return data;
};
