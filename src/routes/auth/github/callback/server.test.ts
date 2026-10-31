import { beforeEach, expect, it, vi } from 'vitest';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { throwError } from '#lib/errors.js';

const state = vi.hoisted(() => ({
  readCallback: vi.fn(),
  getUser: vi.fn(),
  login: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock('#lib/server/auth.js', () => ({ readGitHubCallbackData: state.readCallback, setAuthCookie: state.setCookie }));
vi.mock('#lib/server/registry.js', () => ({ db: {}, adapters: { githubOAuth: { getUser: state.getUser } } }));
vi.mock('#lib/server/use-cases/user.js', () => ({ loginWithGitHub: state.login }));

import { GET } from './+server';

const request = { cookies: {} } as RequestEvent;

beforeEach(() => {
  vi.resetAllMocks();
  state.readCallback.mockReturnValue({ code: 'code', data: { next: '/console' } });
  state.getUser.mockResolvedValue({ id: 123, username: 'alice' });
});

it('sets the session cookie and returns the successful callback destination', async () => {
  const session = { id: 'session' };
  state.login.mockResolvedValue(session);
  const response = await GET(request);

  expect(state.setCookie).toHaveBeenCalledWith(request.cookies, session);
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe('/console');
});

it.each([
  () => throwError('PARAMETER_INVALID', { username: '用户名已存在' }),
  () => error(404, 'Not Found'),
  () => {
    throw new Error('offline');
  },
  () => {
    throw 'non-Error failure';
  },
])('propagates callback failures unchanged to the framework', async (fail) => {
  const failure = await Promise.resolve()
    .then(fail)
    .catch((caught: unknown) => caught);
  state.getUser.mockRejectedValue(failure);

  await expect(GET(request)).rejects.toBe(failure);
  expect(state.login).not.toHaveBeenCalled();
  expect(state.setCookie).not.toHaveBeenCalled();
});
