import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const articles = await locals.article.listArticles(10, 0);
  return {
    articles: articles,
  };
};
