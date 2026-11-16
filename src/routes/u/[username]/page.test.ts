import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  calls: [] as string[],
  cookies: { get: vi.fn(), delete: vi.fn() },
  invalidateSession: vi.fn(),
}));

vi.mock('$app/server', () => ({
  form: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'form' } }),
  query: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'query' } }),
  getRequestEvent: () => ({ cookies: mocks.cookies }),
}));

vi.mock('#lib/server/registry.js', () => ({ db: { name: 'registry' } }));

vi.mock('#lib/server/use-cases/session.js', () => ({ invalidateSession: mocks.invalidateSession }));

import { logout } from './page.remote';
import { AUTH_COOKIE_NAME } from '#lib/server/auth.js';

const submitLogout = logout as unknown as () => Promise<never>;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.calls.length = 0;
  mocks.invalidateSession.mockImplementation(async () => void mocks.calls.push('invalidate'));
  mocks.cookies.delete.mockImplementation(() => void mocks.calls.push('delete-cookie'));
});

it('deletes the stored session before the cookie, then redirects home', async () => {
  mocks.cookies.get.mockReturnValue('session.secret');

  await expect(submitLogout()).rejects.toMatchObject({ status: 303, location: '/' });
  expect(mocks.cookies.get).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
  expect(mocks.invalidateSession).toHaveBeenCalledWith({ db: { name: 'registry' } }, { token: 'session.secret' });
  expect(mocks.cookies.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME, { path: '/' });
  expect(mocks.calls).toEqual(['invalidate', 'delete-cookie']);
});

it('deletes the cookie without a session lookup when no token is present', async () => {
  mocks.cookies.get.mockReturnValue(undefined);

  await expect(submitLogout()).rejects.toMatchObject({ status: 303, location: '/' });
  expect(mocks.invalidateSession).not.toHaveBeenCalled();
  expect(mocks.cookies.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME, { path: '/' });
});
