import { AppError } from '$lib/errors';
import { updateUsername } from '$lib/server/user';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
  default: async ({ locals, request }) => {
    const userId = locals.user?.id;
    if (!userId) {
      return AppError.Unauthorized('update username').throw();
    }
    const data = await request.formData();
    const username = data.get('username');
    if (typeof username !== 'string') {
      return { error: '用户名不能为空' };
    }
    if (username.length === 0) {
      return {
        username: typeof username === 'string' ? username : undefined,
        error: '用户名不能为空',
      };
    } else if (username === locals.user!.username) {
      return { username };
    }

    try {
      await updateUsername(locals, userId, username);
    } catch (e) {
      if (e instanceof Error) {
        return {
          username: typeof username === 'string' ? username : undefined,
          error: e.message,
        };
      }
      return {
        username: typeof username === 'string' ? username : undefined,
        error: JSON.stringify(e),
      };
    }
    redirect(301, `/u/${username}`);
  },
} satisfies Actions;
