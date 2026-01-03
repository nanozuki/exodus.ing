import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { services } from '$lib/server/registry';
import { catchError } from '$lib/errors';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const pendingData = services.auth.getPendingRegistration(cookies);
  if (!pendingData) {
    // No pending registration, redirect to auth page
    redirect(302, '/auth');
  }
  const next = url.searchParams.get('next') || pendingData.next || undefined;
  return {
    next,
    githubUsername: pendingData.githubUsername,
  };
};

export const actions = {
  default: async ({ cookies, request }) => {
    const pendingData = services.auth.getPendingRegistration(cookies);
    if (!pendingData) {
      redirect(302, '/auth');
    }

    const data = await request.formData();
    const next = data.get('next');
    const usernameInput = data.get('username');
    const nameInput = data.get('name');

    // Use GitHub username as default if not provided
    const username =
      typeof usernameInput === 'string' && usernameInput.trim().length > 0
        ? usernameInput.trim()
        : pendingData.githubUsername;

    // Use username as default name if not provided
    const name = typeof nameInput === 'string' && nameInput.trim().length > 0 ? nameInput.trim() : username;

    try {
      await services.auth.completeRegistration(cookies, pendingData, username, name);
    } catch (e) {
      const error = catchError(e);
      return fail(400, { username, name, error: error.message });
    }

    const redirectUrl = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/';
    redirect(302, redirectUrl);
  },
} satisfies Actions;
