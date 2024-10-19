import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const articleView = await locals.articlePage.getById(params.articleId);
  return articleView;
};
