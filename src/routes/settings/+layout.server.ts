import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.layouts.requireLoggedInUser();
  return { user };
};
