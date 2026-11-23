import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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

// Linked pages must never be fetched, so any fetch fails the request.
async function serve(): Promise<Response> {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('The feed must not fetch linked pages');
    }),
  );
  return GET({} as never);
}

async function itemOf(id: string) {
  const feed = await (await serve()).json();
  return feed.items.find((item: { id: string }) => item.id === id);
}

describe('GET', () => {
  it('responds with the JSON Feed content type and a two-hour public cache', async () => {
    const response = await serve();
    expect(response.headers.get('content-type')).toBe('application/feed+json');
    expect(response.headers.get('cache-control')).toBe('public, max-age=7200');
  });

  it('serves a JSON Feed 1.1 document with every article when there are fewer than 30', async () => {
    const feed = await (await serve()).json();
    expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
    expect(feed.items).toHaveLength(26);
  });

  it('compiles a Markdown article to HTML, H1 included', async () => {
    const markdown = await itemOf(articleSamples.markdownSample.id);
    expect(markdown.content_html).toContain('<h1>Markdown Showcase (English)</h1>');
  });

  it('turns an external article into a notice with external_url, without fetching the page', async () => {
    const external = await itemOf(articleSamples.externalSample.id);
    expect(external.external_url).toBe(articleSamples.externalSample.content);
    expect(external.content_html).toContain('此文章发表于站外');
  });

  it("gives each item the author's public profile as both author and authors", async () => {
    const external = await itemOf(articleSamples.externalSample.id);
    const author = getAuthor(articleSamples.externalSample);
    expect(external.author).toEqual({ name: author.name, url: `https://exodus.ing/u/@${author.username}` });
    expect(external.authors).toEqual([external.author]);
  });
});
