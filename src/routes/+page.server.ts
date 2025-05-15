import { services } from '$lib/server/registry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1') || 1;
  const data = await services.articleList.list(page);
  return data;
};
