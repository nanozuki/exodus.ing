import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const data = await locals.homePage.getArticles(1);
  console.log(data);
  return data;
};
