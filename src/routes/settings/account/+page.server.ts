import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { services } from '$lib/server/registry';

export const actions = {
  default: async ({ locals, request }) => {
    const user = locals.requireLoggedInUser('update username');
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
    } else if (username === user.username) {
      return { username };
    }

    try {
      await services.user.updateUsername(user.id, username);
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
