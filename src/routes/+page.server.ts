import { listArticles } from '$lib/server/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const articles = await listArticles(locals, 100, 0);
  return {
    articles: articles,
  };
};
