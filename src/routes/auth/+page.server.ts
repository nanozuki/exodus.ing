import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { services } from '$lib/server/registry';

export const load: PageServerLoad = async ({ url }) => {
  const next = url.searchParams.get('next') || undefined;
  return { next };
};

export const actions = {
  register: async ({ cookies, request }) => {
    const data = await request.formData();
    const inviteCode = data.get('inviteCode');
    if (typeof inviteCode !== 'string' || inviteCode.length === 0) {
      return fail(400, { error: { inviteCode: '邀请码不能为空' } });
    }
    const nextInput = data.get('next');
    const next = typeof nextInput === 'string' && nextInput.length > 0 ? nextInput : undefined;
    // TODO: do not need invite code for now
    // const valid = await services.inviteCode.validateInviteCode(inviteCode);
    // if (!valid) {
    //   return fail(400, { error: { inviteCode: '邀请码无效' } });
    // }

    const authUrl = await services.auth.authByGithub(cookies, { inviteCode, next });
    redirect(302, authUrl.toString());
  },
  login: async ({ cookies, request }) => {
    const data = await request.formData();
    const nextInput = data.get('next');
    const next = typeof nextInput === 'string' && nextInput.length > 0 ? nextInput : undefined;
    const authUrl = await services.auth.authByGithub(cookies, { next });
    redirect(302, authUrl.toString());
  },
} satisfies Actions;
