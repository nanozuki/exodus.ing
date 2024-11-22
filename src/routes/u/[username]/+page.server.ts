import type { PageServerLoad } from './$types';

type PageTab = 'articles' | 'bookmarks';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const view = await locals.userPage.getViewByUsernameOrId(params.username, locals.layouts.loggedInUser);
  const tab: PageTab = url.searchParams.get('tab') === 'bookmarks' ? 'bookmarks' : 'articles';
  const loggedInUser = locals.layouts.loggedInUser;
  const bookmarkedArticles = loggedInUser
    ? await locals.userPage.getBookmarkedArticles(loggedInUser.id, 1)
    : { number: 1, total: 1, items: [] };
  return {
    ...view,
    tab,
    bookmarkedArticles,
  };
};
