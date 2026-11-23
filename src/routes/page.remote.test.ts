import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ event: {}, listArticles: vi.fn() }));

// The query mock runs the real input schema before the handler, as SvelteKit does at the remote boundary.
vi.mock('$app/server', () => ({
  query: (
    schemaOrHandler: { parse(input: unknown): unknown } | (() => unknown),
    handler?: (input: unknown) => unknown,
  ) =>
    Object.assign(
      handler
        ? async (input: unknown) => handler((schemaOrHandler as { parse(input: unknown): unknown }).parse(input))
        : schemaOrHandler,
      { __: { type: 'query' } },
    ),
  form: (_schema: unknown, handler?: unknown) => Object.assign(handler ?? _schema!, { __: { type: 'form' } }),
  getRequestEvent: () => state.event,
}));

vi.mock('#lib/server/registry.js', () => ({ db: {} }));
vi.mock('#lib/server/repositories/article.js', () => ({ listArticles: state.listArticles }));

import { loadPageData } from './page.remote';

beforeEach(() => {
  vi.clearAllMocks();
  state.listArticles.mockImplementation(async (_db, page) => ({ ...page, count: 0, items: [] }));
});

describe('loadPageData', () => {
  it.each([
    [null, 1],
    ['garbage', 1],
    ['0', 1],
    ['2tail', 2],
  ])('reads page %s as page %i', async (value, page) => {
    expect(await loadPageData({ page: value })).toEqual({
      page,
      articles: { pageNumber: page, pageSize: 20, count: 0, items: [] },
    });
  });

  it('rejects a negative page', async () => {
    await expect(loadPageData({ page: '-1' })).rejects.toBeDefined();
  });
});
