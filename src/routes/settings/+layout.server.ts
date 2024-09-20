import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { Unauthorized, UserNotFound } from '$lib/errors';
import { getUserById } from '$lib/server/user';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return error(401, Unauthorized('User settings'));
  }
  const user = await getUserById(locals, locals.user?.id);
  if (!user) {
    return error(404, UserNotFound(locals.user?.id));
  }
  return { user };
};
