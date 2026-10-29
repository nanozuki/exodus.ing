import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { z } from 'zod';
import type { Session } from '#lib/models/session.js';
import type { Permission } from '#lib/models/role.js';
import { userHasPermission, type LoggedInUser } from '#lib/models/user.js';
import { throwError } from '#lib/errors.js';
import type { GitHubOAuth } from '#lib/server/adapters/github_auth.js';
import { db } from './registry';
import { now } from '#lib/server/adapters/clock.js';
import { validateSession } from '#lib/server/use-cases/session.js';
import { findUserById } from '#lib/server/repositories/user.js';
import { getRolesOfUser } from '#lib/server/repositories/role.js';

const GITHUB_OAUTH_COOKIE_NAME = 'github_oauth_state';

export const AUTH_COOKIE_NAME = 'auth_session';

const OAuthCookieDataSchema = z.object({
  state: z.string(),
  next: z.string().optional(),
  signUp: z
    .object({
      username: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

export type OAuthCookieData = z.infer<typeof OAuthCookieDataSchema>;

export type OAuthCookieDataInput = Omit<OAuthCookieData, 'state'>;

// Call only at request boundaries where cookie writes are permitted.
export function setAuthCookie(cookies: Cookies, session: Session): void {
  cookies.set(AUTH_COOKIE_NAME, session.id, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    expires: session.expiresAt,
  });
}

// Call before redirecting so the callback can match its state to the HTTP-only cookie.
export function createGitHubAuthUrl(cookies: Cookies, githubOAuth: GitHubOAuth, input: OAuthCookieDataInput): URL {
  const data = { state: generateState(), ...input };
  cookies.set(GITHUB_OAUTH_COOKIE_NAME, JSON.stringify(data), {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 600,
    sameSite: 'lax',
  });
  return githubOAuth.createAuthUrl(data.state);
}

// Malformed cookie JSON propagates a parse error; the callback route owns error normalization.
export function readGitHubCallbackData(request: RequestEvent): { code: string; data: OAuthCookieData } {
  const { cookies, url } = request;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return throwError('BAD_REQUEST', 'OAuth 验证错误: code or state is empty');
  }
  const stateCookie = cookies.get(GITHUB_OAUTH_COOKIE_NAME);
  if (!stateCookie) {
    return throwError('BAD_REQUEST', 'OAuth 验证错误: state cookie not found');
  }
  const stateResult = OAuthCookieDataSchema.safeParse(JSON.parse(stateCookie));
  if (!stateResult.success) {
    return throwError('BAD_REQUEST', 'OAuth 验证错误: state cookie parse error');
  }
  const cookiesData = stateResult.data;
  if (state !== cookiesData.state) {
    return throwError('BAD_REQUEST', 'OAuth 验证错误: invalid state');
  }
  return { code, data: cookiesData };
}

async function loadSession(event: RequestEvent): Promise<LoggedInUser | null> {
  const sessionId = event.cookies.get(AUTH_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }
  const result = await validateSession({ db, now }, { sessionId });
  if (!result) {
    return null;
  }
  if (result.refresh) {
    setAuthCookie(event.cookies, result.session);
  }
  const [user, roles] = await Promise.all([
    findUserById(db, result.session.userId),
    getRolesOfUser(db, result.session.userId),
  ]);
  return user ? { ...user, roles } : null;
}

// Populate existing locals; invalid or missing sessions are anonymous. Invalid cookies are left in place.
export async function attachLocals(event: RequestEvent): Promise<void> {
  const loggedInUser = await loadSession(event);

  function requireLoggedInUser(operation: string): LoggedInUser {
    if (!loggedInUser) {
      return throwError('UNAUTHORIZED', { operation });
    }
    return loggedInUser;
  }

  function hasPermission(p: Permission): boolean {
    return userHasPermission(loggedInUser, p);
  }

  function requirePermission(p: Permission, operation: string): LoggedInUser {
    const user = requireLoggedInUser(operation);
    if (hasPermission(p)) {
      return user;
    }
    return throwError('FORBIDDEN', { operation });
  }

  Object.assign(event.locals, {
    loggedInUser,
    requireLoggedInUser,
    hasPermission,
    requirePermission,
  });
}
