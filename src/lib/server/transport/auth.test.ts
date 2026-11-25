import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

const mocks = vi.hoisted(() => ({ validateSession: vi.fn(), findUser: vi.fn(), roles: vi.fn() }));

vi.mock('#lib/server/registry.js', () => ({ db: {} }));

vi.mock('#lib/server/use-cases/session.js', () => ({ validateSession: mocks.validateSession }));

vi.mock('#lib/server/repositories/user.js', () => ({ findUserById: mocks.findUser }));

vi.mock('#lib/server/repositories/role.js', () => ({ getRolesOfUser: mocks.roles }));

import {
  attachLocals,
  createGitHubAuthUrl,
  deleteAuthCookie,
  deleteSignUpCookie,
  readAuthCookie,
  readGitHubCallbackData,
  readSignUpCookie,
  sanitizeNext,
  setAuthCookie,
  setSignUpCookie,
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
    'auth_session',
    'id.secret',
    expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', expires: expiresAt }),
  );
});

it.each([
  [undefined, 'https://app.test/'],
  ['', 'https://app.test/'],
  ['/console', 'https://app.test/console'],
  ['/a/A25?tab=comments#reply', 'https://app.test/a/A25?tab=comments#reply'],
  ['/a/..//evil.example', 'https://app.test/a/..//evil.example'],
  ['//evil.example', 'https://app.test//evil.example'],
  ['/\\evil.example', 'https://app.test/\\evil.example'],
  ['@evil.example', 'https://app.test/'],
  ['.evil.example', 'https://app.test/'],
  ['https://evil.example', 'https://app.test/'],
  ['javascript:alert(1)', 'https://app.test/'],
])('turns next %j into %j', (next, expected) => {
  expect(sanitizeNext(next, 'https://app.test/')).toBe(expected);
});

it.each(['/a/..//evil.example', '//evil.example', '/\\evil.example', '@evil.example', '.evil.example'])(
  'keeps next %j on the app host',
  (next) => {
    expect(new URL(sanitizeNext(next, 'https://app.test')).host).toBe('app.test');
  },
);

it('owns OAuth state cookies while passing only a state string to the provider', () => {
  const createAuthUrl = vi.fn(() => new URL('https://provider.test'));
  createGitHubAuthUrl(cookies as unknown as Cookies, { createAuthUrl } as unknown as GitHubOAuth, {
    next: '/console',
  });
  const data = JSON.parse(cookies.set.mock.calls[0][1]);
  expect(data).toEqual({ state: expect.any(String), next: '/console' });
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

it('validates callback state and rejects a malformed cookie as BAD_REQUEST', () => {
  const event = {
    cookies,
    url: new URL('https://app.test/auth/github/callback?code=code&state=state'),
  } as unknown as RequestEvent;
  cookies.get.mockReturnValue(JSON.stringify({ state: 'state', next: '/console' }));
  expect(readGitHubCallbackData(event)).toEqual({ code: 'code', data: { state: 'state', next: '/console' } });
  for (const cookie of [JSON.stringify({ state: 'different' }), '{', JSON.stringify({ next: '/' }), undefined]) {
    cookies.get.mockReturnValue(cookie);
    expect(() => readGitHubCallbackData(event)).toThrow(
      expect.objectContaining({
        status: 400,
        body: expect.objectContaining({ detail: expect.objectContaining({ tag: 'BAD_REQUEST' }) }),
      }),
    );
  }
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
    'auth_session',
    'session.secret',
    expect.objectContaining({ expires: session.expiresAt }),
  );
});

// A cookie jar that keeps values by name, so reads observe earlier writes and deletions.
function jar() {
  const values = new Map<string, string>();
  return {
    get: vi.fn((name: string) => values.get(name)),
    set: vi.fn((name: string, value: string) => void values.set(name, value)),
    delete: vi.fn((name: string) => void values.delete(name)),
  } as unknown as Cookies & { set: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
}

// Covers: setAuthCookie, readAuthCookie, deleteAuthCookie
it('reads back the session token it wrote until the cookie is deleted', () => {
  const cookieJar = jar();
  expect(readAuthCookie(cookieJar)).toBeUndefined();
  setAuthCookie(cookieJar, { token: 'id.secret', expiresAt: new Date('2026-05-01') });
  expect(readAuthCookie(cookieJar)).toBe('id.secret');
  deleteAuthCookie(cookieJar);
  expect(readAuthCookie(cookieJar)).toBeUndefined();
  expect(cookieJar.delete).toHaveBeenCalledWith('auth_session', { path: '/' });
});

describe('setSignUpCookie', () => {
  it('writes an HTTP-only, lax cookie at / expiring with the pending sign-up', () => {
    const cookieJar = jar();
    const expiresAt = new Date('2026-05-01T00:10:00Z');
    setSignUpCookie(cookieJar, { token: 'pending.secret', expiresAt });
    expect(cookieJar.set).toHaveBeenCalledWith(
      'sign_up_session',
      'pending.secret',
      expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', expires: expiresAt }),
    );
  });
});

// Covers: readSignUpCookie, deleteSignUpCookie
it('reads back the pending sign-up token until the cookie is deleted, apart from the auth cookie', () => {
  const cookieJar = jar();
  setSignUpCookie(cookieJar, { token: 'pending.secret', expiresAt: new Date('2026-05-01') });
  setAuthCookie(cookieJar, { token: 'auth.secret', expiresAt: new Date('2026-05-01') });
  expect(readSignUpCookie(cookieJar)).toBe('pending.secret');
  deleteSignUpCookie(cookieJar);
  expect(readSignUpCookie(cookieJar)).toBeUndefined();
  expect(readAuthCookie(cookieJar)).toBe('auth.secret');
  expect(cookieJar.delete).toHaveBeenCalledWith('sign_up_session', { path: '/' });
});
