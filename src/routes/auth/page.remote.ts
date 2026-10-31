import { form, getRequestEvent } from '$app/server';
import { adapters, db } from '#lib/server/registry.js';
import { validateSignUp } from '#lib/server/use-cases/user.js';
import { createGitHubAuthUrl } from '#lib/server/auth.js';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import type { OAuthCookieDataInput } from '#lib/server/auth.js';
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

export const loginByGithub = form(loginByGithubSchema, async ({ next }) => {
  const { cookies } = getRequestEvent();
  const input: OAuthCookieDataInput = {};
  if (next && next.length > 0) {
    input.next = next;
  }
  const authUrl = createGitHubAuthUrl(cookies, adapters.githubOAuth, input);
  redirect(302, authUrl.toString(), { external: ['https://github.com'] });
});
