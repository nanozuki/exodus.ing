import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const view = await locals.userPage.getViewByUsernameOrId(
    params.username,
    locals.layouts.loggedInUser,
  );
  return view;
};
