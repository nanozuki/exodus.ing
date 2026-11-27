import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: { set: vi.fn() },
  createAuthUrl: vi.fn(),
}));

vi.mock('$app/server', () => ({
  form: (_schema: unknown, handler: object) => Object.assign(handler, { __: { type: 'form' } }),
  getRequestEvent: () => ({ cookies: mocks.cookies }),
}));

vi.mock('#lib/server/registry.js', () => ({
  db: {},
  adapters: { githubOAuth: { createAuthUrl: mocks.createAuthUrl } },
}));

import { loginByGithub } from './page.remote';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createAuthUrl.mockImplementation((state: string) => {
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('state', state);
    return url;
  });
});

// The form mock exposes each server handler so the real cookie and redirect helpers run.
type Handler = (input: object) => Promise<never>;
const login = loginByGithub as unknown as Handler;

const githubRedirect = {
  status: 302,
  location: expect.stringMatching(/^https:\/\/github\.com\/login\/oauth\/authorize\?state=/),
};

// The OAuth state cookie the handler wrote, parsed.
function stateCookie(): Record<string, unknown> {
  return JSON.parse(mocks.cookies.set.mock.calls[0][1]);
}

describe('loginByGithub', () => {
  it('redirects to GitHub with the OAuth state that the state cookie keeps with next', async () => {
    await expect(login({ next: '/console' })).rejects.toMatchObject(githubRedirect);
    const data = stateCookie();
    expect(data).toMatchObject({ state: expect.any(String), next: '/console' });
    expect(mocks.createAuthUrl).toHaveBeenCalledWith(data.state);
  });

  it('keeps only the state and next in the state cookie', async () => {
    await expect(login({ next: '/console' })).rejects.toMatchObject(githubRedirect);
    expect(Object.keys(stateCookie()).sort()).toEqual(['next', 'state']);
  });

  it('rejects an OAuth URL outside the redirect allowlist', async () => {
    mocks.createAuthUrl.mockReturnValue(new URL('https://unexpected.example/authorize'));
    await expect(login({ next: '/console' })).rejects.toThrow('redirect_external_not_in_allowlist');
  });
});
