import type { Handle } from '@sveltejs/kit/hooks';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  environment: { dev: false, building: false },
  attachLocals: vi.fn(),
  getConfig: vi.fn(() => ({ appUrl: 'https://exodus.ing' })),
}));

vi.mock('$app/env', () => mocks.environment);
vi.mock('#lib/server/auth.js', () => ({ attachLocals: mocks.attachLocals }));
vi.mock('#lib/server/config.js', () => ({ getConfig: mocks.getConfig }));
vi.mock('#lib/server/registry.js', () => ({ db: {}, adapters: {}, buildServices: vi.fn() }));

import { handle } from './hooks.server';
import { GET } from './routes/healthcheck/+server';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.environment.dev = false;
  mocks.environment.building = false;
  mocks.getConfig.mockReturnValue({ appUrl: 'https://exodus.ing' });
});

function request(url: string, method = 'GET') {
  const event = { request: new Request(url, { method }), url: new URL(url) };
  const response = new Response('resolved');
  const resolve = vi.fn().mockResolvedValue(response);
  const result = handle({ event, resolve } as unknown as Parameters<Handle>[0]);
  return { event, response, resolve, result };
}

it.each(['http://127.0.0.1:3000/healthcheck', 'https://exodus.ing/healthcheck'])(
  'serves the health check without canonicalization or authentication at %s',
  async (url) => {
    const event = { request: new Request(url), url: new URL(url) };
    const resolve = vi.fn(() => GET({} as never));
    const response = await handle({ event, resolve } as unknown as Parameters<Handle>[0]);
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(mocks.getConfig).not.toHaveBeenCalled();
    expect(mocks.attachLocals).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledWith(event);
  },
);

it('still canonicalizes paths below the health check', async () => {
  await expect(request('http://127.0.0.1:3000/healthcheck/private').result).rejects.toMatchObject({
    status: 308,
    location: 'https://exodus.ing/healthcheck/private',
  });
});

it.each(['GET', 'HEAD', 'POST'])(
  'permanently redirects %s requests before authentication and resolution',
  async (method) => {
    const { result, resolve } = request('https://exodus-ing.fly.dev/a/123?page=2&next=%2Fconsole', method);
    await expect(result).rejects.toMatchObject({
      status: 308,
      location: 'https://exodus.ing/a/123?page=2&next=%2Fconsole',
    });
    expect(mocks.attachLocals).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
  },
);

it.each(['https://exodus.ing.evil.example/a', 'https://exodus.ing:8443/a', 'http://exodus.ing/a'])(
  'compares the complete origin for %s',
  async (url) => {
    await expect(request(url).result).rejects.toMatchObject({
      status: 308,
      location: 'https://exodus.ing/a',
    });
  },
);

it('preserves a double-slash pathname without changing the redirect origin', async () => {
  await expect(request('https://exodus-ing.fly.dev//evil.example/a?q=1').result).rejects.toMatchObject({
    status: 308,
    location: 'https://exodus.ing//evil.example/a?q=1',
  });
});

it('uses the configured canonical origin', async () => {
  mocks.getConfig.mockReturnValue({ appUrl: 'https://canonical.example:8443/' });
  await expect(request('https://exodus-ing.fly.dev/a').result).rejects.toMatchObject({
    status: 308,
    location: 'https://canonical.example:8443/a',
  });
});

it('resolves canonical requests without a redirect loop', async () => {
  const { result, response, resolve, event } = request('https://exodus.ing/a/123?page=2');
  await expect(result).resolves.toBe(response);
  expect(mocks.attachLocals).toHaveBeenCalledWith(event);
  expect(resolve).toHaveBeenCalledWith(event);
});

it.each(['dev', 'building'] as const)('skips canonicalization while %s', async (phase) => {
  mocks.environment[phase] = true;
  const { result, response, resolve } = request('http://localhost:4173/a');
  await expect(result).resolves.toBe(response);
  expect(mocks.getConfig).not.toHaveBeenCalled();
  expect(resolve).toHaveBeenCalledOnce();
});

it('uses the local APP_URL during preview', async () => {
  mocks.getConfig.mockReturnValue({ appUrl: 'http://localhost:4173' });
  const { result, response } = request('http://localhost:4173/a');
  await expect(result).resolves.toBe(response);
});
