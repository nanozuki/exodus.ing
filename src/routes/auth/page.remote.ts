import { form, getRequestEvent } from '$app/server';
import { adapters, db } from '#lib/server/registry.js';
import { validateSignUp } from '#lib/server/use-cases/user.js';
import { createGitHubAuthUrl } from '#lib/server/transport/auth.js';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import type { OAuthCookieDataInput } from '#lib/server/transport/auth.js';
import z from 'zod';

const registerByGithubSchema = z.object({
  next: z.string().optional(),
  username: z.string().optional(),
  name: z.string().optional(),
});

const loginByGithubSchema = z.object({
  next: z.string().optional(),
});

const normalizeOptional = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Starts GitHub OAuth for a new account. Trims `username` and `name`, treating blank values as absent, and checks them
 * with `validateSignUp`; its PARAMETER_INVALID `username` and `name` become field issues, and other errors propagate.
 * The check does not reserve the names. A nonempty `next` and the signup values travel in the OAuth state cookie, then
 * the form redirects 302 to GitHub.
 */
export const registerByGithub = form(registerByGithubSchema, async ({ next, username, name }, issue) => {
  const { cookies } = getRequestEvent();
  const normalizedUsername = normalizeOptional(username);
  const normalizedName = normalizeOptional(name);
  try {
    await validateSignUp({ db }, { username: normalizedUsername, name: normalizedName });
  } catch (error) {
    if (isHttpError(error) && error.body.detail?.tag === 'PARAMETER_INVALID') {
      const fields = error.body.detail.value;
      if (fields.username) invalid(issue.username(fields.username));
      if (fields.name) invalid(issue.name(fields.name));
    }
    throw error;
  }

  const input: OAuthCookieDataInput = {};
  if (next && next.length > 0) {
    input.next = next;
  }
  if (normalizedUsername || normalizedName) {
    input.signUp = {};
    if (normalizedUsername) {
      input.signUp.username = normalizedUsername;
    }
    if (normalizedName) {
      input.signUp.name = normalizedName;
    }
  }

  const authUrl = createGitHubAuthUrl(cookies, adapters.githubOAuth, input);
  redirect(302, authUrl.toString(), { external: ['https://github.com'] });
});

/**
 * Starts GitHub OAuth for sign-in, keeping a nonempty `next` in the OAuth state cookie, and redirects 302 to GitHub.
 * It creates no local user.
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
