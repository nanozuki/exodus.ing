import type { PageTab } from '$lib/server/interfaces/pages/user_page';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const username = params.username;
  const tab: PageTab = url.searchParams.get('tab') === 'bookmarks' ? 'bookmarks' : 'articles';
  const page: number = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
  const loggedInUser = locals.layouts.loggedInUser;
  const view = await locals.userPage.getViewByUsernameOrId({
    username,
    loggedInUser,
    tab,
    pageNumber: page,
  });
  return view;
};
