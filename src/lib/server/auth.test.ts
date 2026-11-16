import { beforeEach, expect, it, vi } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

const mocks = vi.hoisted(() => ({ validateSession: vi.fn(), findUser: vi.fn(), roles: vi.fn() }));

vi.mock('./registry', () => ({ db: {} }));

vi.mock('#lib/server/use-cases/session.js', () => ({ validateSession: mocks.validateSession }));

vi.mock('#lib/server/repositories/user.js', () => ({ findUserById: mocks.findUser }));

vi.mock('#lib/server/repositories/role.js', () => ({ getRolesOfUser: mocks.roles }));

import {
  AUTH_COOKIE_NAME,
  attachLocals,
  createGitHubAuthUrl,
  readGitHubCallbackData,
  sanitizeNext,
  setAuthCookie,
} from './auth';
import type { GitHubOAuth } from '#lib/server/adapters/github_auth.js';

const cookies = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

beforeEach(() => {
  vi.resetAllMocks();
});

it('writes the session token with the supplied expiry and lax same-site', () => {
  const expiresAt = new Date('2026-05-01');
  setAuthCookie(cookies as unknown as Cookies, { token: 'id.secret', expiresAt });
  expect(cookies.set).toHaveBeenCalledWith(
    AUTH_COOKIE_NAME,
    'id.secret',
    expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', expires: expiresAt }),
  );
});

it.each([
  [undefined, '/'],
  ['', '/'],
  ['/console', '/console'],
  ['/a/A25?tab=comments#reply', '/a/A25?tab=comments#reply'],
  ['https://app.test/console', '/console'],
  ['//evil.example', '/'],
  ['/\\evil.example', '/'],
  ['https://evil.example', '/'],
  ['javascript:alert(1)', '/'],
  ['http://', '/'],
])('sanitizes next %j to %j', (next, expected) => {
  expect(sanitizeNext(next, 'https://app.test')).toBe(expected);
});

it('owns OAuth state cookies while passing only a state string to the provider', () => {
  const createAuthUrl = vi.fn(() => new URL('https://provider.test'));
  createGitHubAuthUrl(cookies as unknown as Cookies, { createAuthUrl } as unknown as GitHubOAuth, {
    next: '/console',
    signUp: { name: 'Test' },
  });
  const data = JSON.parse(cookies.set.mock.calls[0][1]);
  expect(data).toMatchObject({ state: expect.any(String), next: '/console', signUp: { name: 'Test' } });
  expect(createAuthUrl).toHaveBeenCalledWith(data.state);
  expect(cookies.set.mock.calls[0][2]).toMatchObject({ maxAge: 600, sameSite: 'lax', httpOnly: true });
});

it.each([
  ['a matching callback', 'code=code&state=state', JSON.stringify({ state: 'state' })],
  ['missing callback fields', '', JSON.stringify({ state: 'state' })],
  ['a mismatched state', 'code=code&state=state', JSON.stringify({ state: 'different' })],
  ['malformed cookie JSON', 'code=code&state=state', '{'],
])('deletes the OAuth state cookie for %s', (_name, query, stateCookie) => {
  const event = { cookies, url: new URL(`https://app.test/auth/github/callback?${query}`) } as unknown as RequestEvent;
  cookies.get.mockReturnValue(stateCookie);
  try {
    readGitHubCallbackData(event);
  } catch {
    // Failure paths must delete the cookie too; the thrown error itself is covered elsewhere.
  }
  expect(cookies.delete).toHaveBeenCalledWith('github_oauth_state', { path: '/' });
});

it('validates callback state and retains malformed JSON error behavior', () => {
  const event = {
    cookies,
    url: new URL('https://app.test/auth/github/callback?code=code&state=state'),
  } as unknown as RequestEvent;
  cookies.get.mockReturnValue(JSON.stringify({ state: 'state', next: '/console' }));
  expect(readGitHubCallbackData(event)).toEqual({ code: 'code', data: { state: 'state', next: '/console' } });
  cookies.get.mockReturnValue(JSON.stringify({ state: 'different' }));
  expect(() => readGitHubCallbackData(event)).toThrow();
  cookies.get.mockReturnValue('{');
  expect(() => readGitHubCallbackData(event)).toThrow(SyntaxError);
});

it('attaches anonymous locals and enforces authentication for missing sessions', async () => {
  const locals = {};
  const event = Object.defineProperty({ cookies }, 'locals', { value: locals }) as unknown as RequestEvent;
  await attachLocals(event);
  expect(event.locals).toBe(locals);
  expect(event.locals.loggedInUser).toBeNull();
  expect(() => event.locals.requireLoggedInUser('test')).toThrow();
  expect(mocks.validateSession).not.toHaveBeenCalled();
});

it('refreshes the cookie with the same token on renewal and loads current identity and roles', async () => {
  cookies.get.mockReturnValue('session.secret');
  const session = { id: 'session', userId: 'user', secretHash: 'hash', expiresAt: new Date('2026-05-01') };
  mocks.validateSession.mockResolvedValue({ session, refresh: true });
  mocks.findUser.mockResolvedValue({ id: 'user', name: 'Current' });
  mocks.roles.mockResolvedValue([]);
  const event = { cookies, locals: {} } as unknown as RequestEvent;
  await attachLocals(event);
  expect(event.locals.loggedInUser).toEqual({ id: 'user', name: 'Current', roles: [] });
  expect(mocks.validateSession).toHaveBeenCalledWith(expect.anything(), { token: 'session.secret' });
  expect(cookies.set).toHaveBeenCalledTimes(1);
  expect(cookies.set).toHaveBeenCalledWith(
    AUTH_COOKIE_NAME,
    'session.secret',
    expect.objectContaining({ expires: session.expiresAt }),
  );
});
