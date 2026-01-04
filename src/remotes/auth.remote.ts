import { form, getRequestEvent } from '$app/server';
import { adapters, repositories } from '$lib/server/registry';
import { throwError } from '$lib/errors';
import { redirect } from '@sveltejs/kit';
import type { OAuthCookieDataInput } from '$lib/domain/values/auth';
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

const validateSignUp = async (username?: string, name?: string) => {
  if (username) {
    if (username.startsWith('@')) {
      return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
    }
    const existingUser = await repositories.user.findByUsername(username);
    if (existingUser) {
      return throwError('PARAMETER_INVALID', { username: '用户名已存在' });
    }
  }
  if (name) {
    const existingUser = await repositories.user.findByName(name);
    if (existingUser) {
      return throwError('PARAMETER_INVALID', { name: '昵称已存在' });
    }
  }
};

export const registerByGithub = form(registerByGithubSchema, async ({ next, username, name }) => {
  const { cookies } = getRequestEvent();
  const normalizedUsername = normalizeOptional(username);
  const normalizedName = normalizeOptional(name);
  await validateSignUp(normalizedUsername, normalizedName);

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

  const authUrl = adapters.githubOAuth.createAuthUrl(cookies, input);
  redirect(302, authUrl.toString());
});

export const loginByGithub = form(loginByGithubSchema, async ({ next }) => {
  const { cookies } = getRequestEvent();
  const input: OAuthCookieDataInput = {};
  if (next && next.length > 0) {
    input.next = next;
  }
  const authUrl = adapters.githubOAuth.createAuthUrl(cookies, input);
  redirect(302, authUrl.toString());
});
