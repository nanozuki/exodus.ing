import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
  register: async ({ locals, request }) => {
    const data = await request.formData();
    const inviteCode = data.get('inviteCode');
    if (typeof inviteCode !== 'string' || inviteCode.length === 0) {
      return fail(400, { error: { inviteCode: '邀请码不能为空' } });
    }
    const valid = await locals.authPage.validateInviteCode(inviteCode);
    if (!valid) {
      return fail(400, { error: { inviteCode: '邀请码无效' } });
    }

    const url = await locals.authPage.registerByGithub(inviteCode);
    redirect(302, url.toString());
  },
  login: async ({ locals }) => {
    const url = await locals.authPage.loginByGithub();
    redirect(302, url.toString());
  },
} satisfies Actions;
