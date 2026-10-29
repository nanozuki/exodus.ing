import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OAuth2RequestError } from 'arctic';
import { GitHubOAuth } from './github_auth';
import type { Config } from '#lib/server/config.js';

const provider = vi.hoisted(() => ({ authorize: vi.fn(), exchange: vi.fn() }));

vi.mock('arctic', async (importOriginal) => ({
  ...(await importOriginal<typeof import('arctic')>()),
  GitHub: class {
    createAuthorizationURL = provider.authorize;
    validateAuthorizationCode = provider.exchange;
  },
}));

const config = { githubClientId: 'id', githubClientSecret: 'secret', appUrl: 'https://app.test' } as Config;

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('passes state only and requests no additional scopes', () => {
  provider.authorize.mockReturnValue(new URL('https://provider.test'));
  expect(new GitHubOAuth(config).createAuthUrl('state')).toEqual(new URL('https://provider.test'));
  expect(provider.authorize).toHaveBeenCalledWith('state', []);
});

it('maps a trusted provider identity with the existing request headers', async () => {
  provider.exchange.mockResolvedValue({ accessToken: () => 'token' });
  const fetch = vi.fn(async () => ({ json: async () => ({ id: 123, login: 'provider-name' }) }));
  vi.stubGlobal('fetch', fetch);
  expect(await new GitHubOAuth(config).getUser('code')).toEqual({ id: 123, username: 'provider-name' });
  expect(provider.exchange).toHaveBeenCalledWith('code');
  expect(fetch).toHaveBeenCalledWith('https://api.github.com/user', {
    headers: { Authorization: 'Bearer token', Accept: 'application/json', 'User-Agent': 'exodus.ing' },
  });
});

it('preserves provider rejection and unexpected failure error categories', async () => {
  const adapter = new GitHubOAuth(config);
  provider.exchange.mockRejectedValue(new OAuth2RequestError('invalid_grant', 'bad code', null, null));
  await expect(adapter.getUser('bad')).rejects.toMatchObject({ status: 400, body: { tag: 'BAD_REQUEST' } });
  provider.exchange.mockRejectedValue(new Error('offline'));
  await expect(adapter.getUser('bad')).rejects.toMatchObject({ status: 500, body: { tag: 'INTERNAL_SERVER_ERROR' } });
});
