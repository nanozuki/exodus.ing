import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return await locals.homePage.getArticles({ size: 10, number: 1 });
};
