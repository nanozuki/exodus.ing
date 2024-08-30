import { Unauthorized, UserNotFound } from '$lib/errors';
import { getUserById, updateProfile } from '$lib/server/user';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return error(401, Unauthorized('User settings'));
  }
  const user = await getUserById(locals, locals.user?.id);
  if (!user) {
    return error(404, UserNotFound(locals.user?.id));
  }
  return {
    user,
  };
};

export const actions = {
  profile: async ({ url, locals, request }) => {
    const data = await request.formData();
    const name = data.get('name');
    if (typeof name !== 'string' || name.length === 0) {
      return fail(400, { error: { name: '名字不能为空' } });
    }
    const aboutMe = data.get('aboutMe');
    if (typeof aboutMe !== 'string') {
      return fail(400, { error: { aboutMe: '介绍必须是字符串' } });
    }
    await updateProfile(locals, locals.user!.id, name, aboutMe);
    redirect(302, url.toString());
  },
} satisfies Actions;
