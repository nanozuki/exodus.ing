import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: { set: vi.fn() },
  createAuthUrl: vi.fn(),
  validateSignUp: vi.fn(),
}));

vi.mock('$app/server', () => ({
  form: (_schema: unknown, handler: object) => Object.assign(handler, { __: { type: 'form' } }),
  getRequestEvent: () => ({ cookies: mocks.cookies }),
}));

vi.mock('#lib/server/registry.js', () => ({
  db: {},
  adapters: { githubOAuth: { createAuthUrl: mocks.createAuthUrl } },
}));

vi.mock('#lib/server/use-cases/user.js', () => ({ validateSignUp: mocks.validateSignUp }));

import { loginByGithub, registerByGithub } from './page.remote';
import { throwError } from '#lib/errors.js';
import { error, invalid, redirect } from '@sveltejs/kit';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createAuthUrl.mockImplementation((state: string) => {
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('state', state);
    return url;
  });
});

// The form mock exposes each server handler so the real cookie and redirect helpers run.
const operations = [
  { name: 'login', submit: loginByGithub, input: { next: '/console' } },
  {
    name: 'registration',
    submit: registerByGithub,
    input: { next: '/console', username: ' alice ', name: ' Alice ' },
  },
];

it.each(operations)(
  'redirects $name to GitHub while preserving OAuth callback state',
  async ({ name, submit, input }) => {
    const handler = submit as unknown as (values: typeof input) => Promise<never>;
    await expect(handler(input)).rejects.toMatchObject({
      status: 302,
      location: expect.stringMatching(/^https:\/\/github\.com\/login\/oauth\/authorize\?state=/),
    });
    const data = JSON.parse(mocks.cookies.set.mock.calls[0][1]);
    expect(data).toMatchObject({ state: expect.any(String), next: '/console' });
    expect(mocks.createAuthUrl).toHaveBeenCalledWith(data.state);
    if (name === 'registration') {
      expect(data.signUp).toEqual({ username: 'alice', name: 'Alice' });
      expect(mocks.validateSignUp).toHaveBeenCalledWith({ db: {} }, { username: 'alice', name: 'Alice' });
    } else {
      expect(data.signUp).toBeUndefined();
    }
  },
);

it.each(operations)('rejects an unexpected OAuth origin for $name', async ({ submit, input }) => {
  mocks.createAuthUrl.mockReturnValue(new URL('https://unexpected.example/authorize'));
  const handler = submit as unknown as (values: typeof input) => Promise<never>;
  await expect(handler(input)).rejects.toThrow('redirect_external_not_in_allowlist');
});

it.each(['username', 'name'] as const)('maps a business %s error to the matching form field', async (field) => {
  mocks.validateSignUp.mockImplementation(() => throwError('PARAMETER_INVALID', { [field]: '已被使用' }));
  const issue = { username: vi.fn(), name: vi.fn() };
  issue[field].mockReturnValue({ path: [field], message: '已被使用' });
  const handler = registerByGithub as unknown as (input: object, issue: object) => Promise<never>;

  await expect(handler({}, issue)).rejects.toMatchObject({
    issues: [{ path: [field], message: '已被使用' }],
  });
  expect(issue[field]).toHaveBeenCalledWith('已被使用');
  expect(mocks.createAuthUrl).not.toHaveBeenCalled();
});

it.each([
  () => throwError('FORBIDDEN', { operation: '注册' }),
  () => error(404, 'Not Found'),
  () => redirect(303, '/auth'),
  () => invalid('输入无效'),
  () => {
    throw new Error('offline');
  },
])('preserves errors and control flow that registration cannot map to a field', async (fail) => {
  const failure = await Promise.resolve()
    .then(fail)
    .catch((caught: unknown) => caught);
  mocks.validateSignUp.mockRejectedValue(failure);
  const handler = registerByGithub as unknown as (input: object, issue: object) => Promise<never>;

  await expect(handler({}, {})).rejects.toBe(failure);
  expect(mocks.createAuthUrl).not.toHaveBeenCalled();
});
