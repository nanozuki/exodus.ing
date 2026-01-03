import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { services } from '$lib/server/registry';
import type { OAuthCookieDataInput } from '$lib/domain/values/auth';

export const load: PageServerLoad = async ({ url }) => {
  const next = url.searchParams.get('next') || undefined;
  return { next };
};

export const actions = {
  auth: async ({ cookies, request }) => {
    const input: OAuthCookieDataInput = {};
    const data = await request.formData();
    const next = data.get('next');
    if (typeof next === 'string' && next.length > 0) {
      input.next = next;
    }
    const authUrl = await services.auth.authByGithub(cookies, input);
    redirect(302, authUrl.toString());
  },
} satisfies Actions;
