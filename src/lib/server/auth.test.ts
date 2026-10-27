import { beforeEach, expect, it, vi } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

const mocks = vi.hoisted(() => ({ validateSession: vi.fn(), findUser: vi.fn(), roles: vi.fn() }));

vi.mock('./registry', () => ({ db: {} }));

vi.mock('$lib/server/use-cases/session', () => ({ validateSession: mocks.validateSession }));

vi.mock('$lib/server/repositories/user', () => ({ findUserById: mocks.findUser }));

vi.mock('$lib/server/repositories/role', () => ({ getRolesOfUser: mocks.roles }));

import { AUTH_COOKIE_NAME, attachLocals, createGitHubAuthUrl, readGitHubCallbackData, setAuthCookie } from './auth';
import type { GitHubOAuth } from '$lib/server/adapters/github_auth';

const cookies = { get: vi.fn(), set: vi.fn() };

beforeEach(() => {
  vi.resetAllMocks();
});

it('writes session transport with the supplied expiry', () => {
  const session = { id: 'session', userId: 'user', expiresAt: new Date('2026-05-01') };
  setAuthCookie(cookies as unknown as Cookies, session);
  expect(cookies.set).toHaveBeenCalledWith(
    AUTH_COOKIE_NAME,
    session.id,
    expect.objectContaining({ path: '/', httpOnly: true, expires: session.expiresAt }),
  );
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
  const event = { cookies } as unknown as RequestEvent;
  await attachLocals(event);
  expect(event.locals.loggedInUser).toBeNull();
  expect(() => event.locals.requireLoggedInUser('test')).toThrow();
  expect(mocks.validateSession).not.toHaveBeenCalled();
});

it('refreshes the cookie only on renewal and loads current identity and roles', async () => {
  cookies.get.mockReturnValue('session');
  const session = { id: 'session', userId: 'user', expiresAt: new Date('2026-05-01') };
  mocks.validateSession.mockResolvedValue({ session, refresh: true });
  mocks.findUser.mockResolvedValue({ id: 'user', name: 'Current' });
  mocks.roles.mockResolvedValue([]);
  const event = { cookies } as unknown as RequestEvent;
  await attachLocals(event);
  expect(event.locals.loggedInUser).toEqual({ id: 'user', name: 'Current', roles: [] });
  expect(cookies.set).toHaveBeenCalledTimes(1);
});
