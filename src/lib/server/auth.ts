// auth.ts adapts requests for hooks, remote functions, and route handlers: the session and OAuth state cookies,
// post-sign-in redirect targets, and `App.Locals`. Models and use cases must not import it. Importing it performs no
// database, network, or cookie operation.

import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { z } from 'zod';
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

/** The GitHub OAuth state cookie's contents, as validated by `readGitHubCallbackData`. */
export type OAuthCookieData = z.infer<typeof OAuthCookieDataSchema>;

export type OAuthCookieDataInput = Omit<OAuthCookieData, 'state'>;

/**
 * Sets the `auth_session` cookie to the session token: path `/`, HTTP-only, SameSite lax, expiring at `expiresAt`, and
 * secure in production. Call only at request boundaries where cookie writes are permitted.
 */
export function setAuthCookie(cookies: Cookies, session: { token: string; expiresAt: Date }): void {
  cookies.set(AUTH_COOKIE_NAME, session.token, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    sameSite: 'lax',
    expires: session.expiresAt,
  });
}

/**
 * Returns the absolute redirect target for a post-sign-in `next`: the origin of `appUrl` followed by `next` when it
 * starts with `/`, and by `/` otherwise, including when `next` is absent or empty. No `next` changes the host:
 * `//evil.example` and `/a/..//evil.example` stay paths on the app origin, while `@evil.example` and
 * `https://evil.example` become `/`. `next` is not otherwise normalized or validated. Pass the configured `APP_URL`,
 * not the request URL, whose origin depends on the request's `Host`. Every redirect to a user-supplied `next` goes
 * through this function.
 */
export function sanitizeNext(next: string | undefined, appUrl: string): string {
  // A leading `/` ends the authority, so nothing in `next` can change the host.
  const path = next?.startsWith('/') ? next : '/';
  return `${new URL(appUrl).origin}${path}`;
}

/**
 * Generates an OAuth state, stores it with `input` as JSON in the `github_oauth_state` cookie (path `/`, HTTP-only,
 * SameSite lax, secure in production, ten-minute max age), and returns GitHub's authorization URL for that state. Call
 * before redirecting so the callback can match its state to the cookie.
 */
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

/**
 * Reads the callback's `code` and `state` and checks them against the `github_oauth_state` cookie. Deletes the cookie
 * before validating, so it is removed on every callback outcome, including later provider-exchange failures. Missing
 * `code` or `state`, a missing or schema-invalid cookie, or a state mismatch throws BAD_REQUEST; malformed cookie JSON
 * propagates its parse error for the callback route to normalize. The caller exchanges the code and sanitizes `next`.
 */
export function readGitHubCallbackData(request: RequestEvent): { code: string; data: OAuthCookieData } {
  const { cookies, url } = request;
  const stateCookie = cookies.get(GITHUB_OAUTH_COOKIE_NAME);
  cookies.delete(GITHUB_OAUTH_COOKIE_NAME, { path: '/' });
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return throwError('BAD_REQUEST', 'OAuth 验证错误: code or state is empty');
  }
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
  const token = event.cookies.get(AUTH_COOKIE_NAME);
  if (!token) {
    return null;
  }
  const result = await validateSession({ db, now }, { token });
  if (!result) {
    return null;
  }
  if (result.refresh) {
    setAuthCookie(event.cookies, { token, expiresAt: result.session.expiresAt });
  }
  const [user, roles] = await Promise.all([
    findUserById(db, result.session.userId),
    getRolesOfUser(db, result.session.userId),
  ]);
  return user ? { ...user, roles } : null;
}

/**
 * Populates `event.locals` from the `auth_session` cookie: `loggedInUser`, `requireLoggedInUser`, `hasPermission`, and
 * `requirePermission`. When session validation extends the session, rewrites the cookie with the same token and the
 * new expiry. A missing or invalid session, or one whose user no longer exists, yields a null user; invalid cookies
 * are left in place. `requireLoggedInUser` throws UNAUTHORIZED and `requirePermission` throws UNAUTHORIZED or
 * FORBIDDEN, each labeled with the given operation. Database errors propagate.
 */
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
