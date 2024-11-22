import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const page = parseInt(url.searchParams.get('page') || '1') || 1;
  const data = await locals.homePage.getArticles(page);
  return data;
};
