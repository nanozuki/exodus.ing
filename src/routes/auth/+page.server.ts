import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const next = url.searchParams.get('next') || undefined;
  return { next };
};

export const actions = {
  register: async ({ locals, request }) => {
    const data = await request.formData();
    const inviteCode = data.get('inviteCode');
    if (typeof inviteCode !== 'string' || inviteCode.length === 0) {
      return fail(400, { error: { inviteCode: '邀请码不能为空' } });
    }
    const nextInput = data.get('next');
    const next = typeof nextInput === 'string' && nextInput.length > 0 ? nextInput : undefined;
    const valid = await locals.authPage.validateInviteCode(inviteCode);
    if (!valid) {
      return fail(400, { error: { inviteCode: '邀请码无效' } });
    }

    const authUrl = await locals.authPage.registerByGithub({ inviteCode, next });
    redirect(302, authUrl.toString());
  },
  login: async ({ locals, request }) => {
    const data = await request.formData();
    const nextInput = data.get('next');
    const next = typeof nextInput === 'string' && nextInput.length > 0 ? nextInput : undefined;
    const authUrl = await locals.authPage.loginByGithub({ next });
    redirect(302, authUrl.toString());
  },
} satisfies Actions;
