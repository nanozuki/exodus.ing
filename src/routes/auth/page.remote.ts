import { form, getRequestEvent } from '$app/server';
import { adapters } from '#lib/server/registry.js';
import { createGitHubAuthUrl } from '#lib/server/transport/auth.js';
import { redirect } from '@sveltejs/kit';
import type { OAuthCookieDataInput } from '#lib/server/transport/auth.js';
import z from 'zod';

const loginByGithubSchema = z.object({
  next: z.string().optional(),
});

/**
 * Starts GitHub OAuth, keeping a nonempty `next` in the OAuth state cookie, and redirects 302 to GitHub. It creates no
 * local user; the callback signs in a known identity or continues to sign-up.
 */
export const loginByGithub = form(loginByGithubSchema, async ({ next }) => {
  const { cookies } = getRequestEvent();
  const input: OAuthCookieDataInput = {};
  if (next && next.length > 0) {
    input.next = next;
  }
  const authUrl = createGitHubAuthUrl(cookies, adapters.githubOAuth, input);
  redirect(302, authUrl.toString(), { external: ['https://github.com'] });
});
