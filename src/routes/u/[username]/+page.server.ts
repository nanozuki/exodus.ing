import { listArticlesByUserId } from '$lib/server/article';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Unauthorized, UserNotFound } from '$lib/errors';
import { getUserById, getUserByUsername, updateUsername } from '$lib/server/user';

export const load: PageServerLoad = async ({ locals, params }) => {
  let user = await getUserByUsername(locals, params.username);
  if (!user) {
    user = await getUserById(locals, params.username);
  }
  if (!user) {
    return error(404, UserNotFound(params.username));
  }
  const articles = await listArticlesByUserId(locals, user.id, 10, 0);
  const isMyself = user.id === locals.user?.id;
  return {
    articles,
    isMyself,
    user,
  };
};

interface FormData {
  username?: string;
  error?: string;
}

export const actions = {
  default: async ({ locals, request }): Promise<FormData> => {
    const userId = locals.user?.id;
    if (!userId) {
      return error(401, Unauthorized('update username'));
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
