import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: { set: vi.fn() },
  findUserById: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock('$app/server', () => ({
  form: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'form' } }),
  query: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'query' } }),
  getRequestEvent: () => ({ cookies: mocks.cookies, url: new URL('https://app.test/auth/testing') }),
}));

vi.mock('#lib/server/config.js', () => ({ getConfig: () => ({ appUrl: 'https://exodus.test' }) }));
vi.mock('#lib/server/registry.js', () => ({ db: {} }));

vi.mock('#lib/server/repositories/user.js', () => ({ findUserById: mocks.findUserById, getUsers: vi.fn() }));

vi.mock('#lib/server/use-cases/session.js', () => ({ createSession: mocks.createSession }));

import { simulateTestingLogin } from './page.remote';

const submit = simulateTestingLogin as unknown as (input: { userId: string; next?: string }) => Promise<never>;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findUserById.mockResolvedValue({ id: 'user' });
  mocks.createSession.mockResolvedValue({
    session: { id: 'session', expiresAt: new Date('2026-05-01') },
    token: 'session.secret',
  });
});

describe('simulateTestingLogin', () => {
  it('sets the session token cookie and redirects to a same-origin next', async () => {
    await expect(submit({ userId: 'user', next: '/console' })).rejects.toMatchObject({
      status: 303,
      location: 'https://exodus.test/console',
    });
    expect(mocks.cookies.set).toHaveBeenCalledWith('auth_session', 'session.secret', expect.anything());
  });

  it('redirects a non-path next to the app home page', async () => {
    await expect(submit({ userId: 'user', next: 'https://evil.example' })).rejects.toMatchObject({
      status: 303,
      location: 'https://exodus.test/',
    });
  });
});
