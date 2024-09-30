import { AppError } from '$lib/errors';
import { getUserById } from '$lib/server/user';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.loggedInUser) {
    return AppError.Unauthorized('User settings').throw();
  }
  const user = await getUserById(locals, locals.loggedInUser?.id);
  if (!user) {
    return AppError.UserNotFound(locals.loggedInUser?.id).throw();
  }
  return { user };
};
