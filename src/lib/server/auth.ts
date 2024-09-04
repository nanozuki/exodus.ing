import { generateState, OAuth2RequestError } from 'arctic';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { error } from '@sveltejs/kit';
import { InternalServerError, OAuthValidationError } from '$lib/errors';
import { type CookieAttributes } from 'lucia';
import { tInviteCode } from '$lib/schema';

export async function validateInviteCode(locals: App.Locals, inviteCode: string): Promise<boolean> {
  const codes = await locals.db.select().from(tInviteCode).where(eq(tInviteCode.code, inviteCode));
  if (codes.length === 0) {
    return false;
  }
  const code = codes[0];
  const now = new Date();
  return code.validFrom.getTime() <= now.getTime() && code.validTo.getTime() >= now.getTime();
}

const State = z.object({
  state: z.string(),
  inviteCode: z.string().optional(),
});
type State = z.infer<typeof State>;

export interface Cookie {
  name: string;
  value: string;
  attributes: CookieAttributes & { path: string };
}

export async function generateStateCookie(
  locals: App.Locals,
  inviteCode?: string,
): Promise<{
  cookie: Cookie;
  url: URL;
}> {
  const state = {
    state: generateState(),
    inviteCode,
  };
  const url = await locals.github.createAuthorizationURL(state.state);
  const stateJson = JSON.stringify(state);
  return {
    url,
    cookie: {
      name: 'github_oauth_state',
      value: stateJson,
      attributes: {
        path: '/',
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: 'lax',
      },
    },
  };
}

export function parseStateCookie(cookie?: string): State | undefined {
  if (!cookie) {
    return undefined;
  }
  try {
    return State.parse(JSON.parse(cookie));
  } catch {
    return undefined;
  }
}

export interface GitHubUser {
  id: number;
  login: string;
}

export async function validateGitHubCode(locals: App.Locals, code: string): Promise<GitHubUser> {
  try {
    const tokens = await locals.github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'exodus.ing',
      },
    });
    return await githubUserResponse.json();
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      error(400, OAuthValidationError(e.message));
    }
    if (e instanceof Error) {
      error(500, InternalServerError(e.message));
    }
    error(500, InternalServerError());
  }
}

export async function generateSessionCookie(locals: App.Locals, userId: string): Promise<Cookie> {
  const session = await locals.lucia.createSession(userId, {});
  const { name, value, attributes } = locals.lucia.createSessionCookie(session.id);
  return {
    name,
    value,
    attributes: {
      path: '.',
      ...attributes,
    },
  };
}
