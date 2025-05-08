import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
  default: async ({ locals, request }) => {
    const data = await request.formData();
    const name = data.get('name');
    if (typeof name !== 'string' || name.length === 0) {
      return fail(400, { error: { name: '名字不能为空' } });
    }
    const aboutMe = data.get('aboutMe');
    if (typeof aboutMe !== 'string') {
      return fail(400, { error: { aboutMe: '介绍必须是字符串' } });
    }
    const user = locals.auth().requireLoggedInUser('update profile');
    await locals.user().updateProfile(user.id, name, aboutMe);
    redirect(303, '/settings/profile');
  },
} satisfies Actions;
