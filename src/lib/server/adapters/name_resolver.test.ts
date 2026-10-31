import { afterEach, expect, it, vi } from 'vitest';
import { resolveTxt } from './name_resolver';

afterEach(() => vi.unstubAllGlobals());

it('treats nonexistent domains and missing TXT answers as unverified', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ Status: 3 }))
    .mockResolvedValueOnce(Response.json({ Status: 0 }))
    .mockResolvedValueOnce(Response.json({ Status: 0, Answer: [{ data: 'verification' }] }));
  vi.stubGlobal('fetch', fetch);
  expect(await resolveTxt('missing.test')).toEqual([]);
  expect(await resolveTxt('empty.test')).toEqual([]);
  expect(await resolveTxt('valid.test')).toEqual(['verification']);
});

it('propagates DNS service, HTTP, network and response failures', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ Status: 2 }))
    .mockResolvedValueOnce(Response.json({ Status: 0 }, { status: 503 }))
    .mockRejectedValueOnce(new Error('network unavailable'))
    .mockResolvedValueOnce(new Response('invalid JSON'));
  vi.stubGlobal('fetch', fetch);
  await expect(resolveTxt('failure.test')).rejects.toMatchObject({ status: 502 });
  await expect(resolveTxt('failure.test')).rejects.toMatchObject({ status: 502 });
  await expect(resolveTxt('failure.test')).rejects.toThrow('network unavailable');
  await expect(resolveTxt('failure.test')).rejects.toBeInstanceOf(SyntaxError);
});
