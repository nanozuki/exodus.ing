import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { articleSamples, getAuthor } from '#lib/testing/data.js';

const state = vi.hoisted(() => ({ db: null as unknown as import('#lib/server/db/schema.js').AppDatabase }));

vi.mock('#lib/server/registry.js', () => ({
  get db() {
    return state.db;
  },
}));

import { GET } from './+server';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('json-feed');
  state.db = database.db;
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

afterEach(() => {
  vi.unstubAllGlobals();
});

it('serves JSON Feed from the real database with public authors, Markdown and external URLs', async () => {
  const fetch = vi.fn(() => {
    throw new Error('The feed must not fetch linked pages');
  });
  vi.stubGlobal('fetch', fetch);
  const response = await GET({} as never);
  expect(response.headers.get('content-type')).toBe('application/feed+json');
  expect(response.headers.get('cache-control')).toBe('public, max-age=7200');
  const feed = await response.json();
  expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
  expect(feed.items).toHaveLength(26);
  const markdown = feed.items.find((item: { id: string }) => item.id === articleSamples.markdownSample.id);
  expect(markdown.content_html).toContain('<h1>Markdown Showcase (English)</h1>');
  const external = feed.items.find((item: { id: string }) => item.id === articleSamples.externalSample.id);
  const author = getAuthor(articleSamples.externalSample);
  expect(external).toMatchObject({
    external_url: articleSamples.externalSample.content,
    author: { name: author.name, url: `https://exodus.ing/u/@${author.username}` },
  });
  expect(external.authors).toEqual([external.author]);
  expect(external.content_html).toContain('此文章发表于站外');
  expect(fetch).not.toHaveBeenCalled();
});
