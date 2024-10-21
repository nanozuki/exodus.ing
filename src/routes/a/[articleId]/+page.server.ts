import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = locals.layouts.loggedInUser;
  const articleView = await locals.articlePage.getById(params.articleId, user);
  return articleView;
};
