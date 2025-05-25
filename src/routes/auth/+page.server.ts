import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { services } from '$lib/server/registry';
import type { StateInput } from '$lib/domain/services/auth';
import { AppError } from '$lib/errors';

export const load: PageServerLoad = async ({ url }) => {
  const next = url.searchParams.get('next') || undefined;
  return { next };
};

export const actions = {
  register: async ({ cookies, request }) => {
    const input: StateInput = {};
    const data = await request.formData();
    const next = data.get('next');
    if (typeof next === 'string' && next.length > 0) {
      input.next = next;
    }
    const username = data.get('username');
    if (typeof username === 'string' && username.trim().length > 0) {
      input.signUp = { username: username.trim() };
    }
    const name = data.get('name');
    if (typeof name === 'string' && name.trim().length > 0) {
      if (!input.signUp) {
        input.signUp = {};
      }
      input.signUp.name = name.trim();
    }

    let authUrl: URL;
    try {
      authUrl = await services.auth.authByGithub(cookies, input);
    } catch (e) {
      const error = AppError.catch(e);
      return fail(400, { username, name, error: error.message });
    }
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
