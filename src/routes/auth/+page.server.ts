import { generateStateCookie, validateInviteCode } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
  register: async ({ cookies, locals, request }) => {
    const data = await request.formData();
    const inviteCode = data.get('inviteCode');
    if (typeof inviteCode !== 'string' || inviteCode.length === 0) {
      return fail(400, { error: { inviteCode: '邀请码不能为空' } });
    }
    const valid = await validateInviteCode(locals, inviteCode);
    if (!valid) {
      return fail(400, { error: { inviteCode: '邀请码无效' } });
    }

    const { cookie, url } = await generateStateCookie(locals, inviteCode);
    cookies.set(cookie.name, cookie.value, { ...cookie.attributes });
    redirect(302, url.toString());
  },
  login: async ({ cookies, locals }) => {
    const { cookie, url } = await generateStateCookie(locals);
    cookies.set(cookie.name, cookie.value, { ...cookie.attributes });
    redirect(302, url.toString());
  },
} satisfies Actions;
