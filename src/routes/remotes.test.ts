import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  event: { locals: {} as App.Locals },
  listArticles: vi.fn(),
  editable: vi.fn(),
  listBookmarks: vi.fn(),
}));

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

vi.mock('#lib/server/registry.js', () => ({ db: {}, adapters: {} }));

vi.mock('#lib/server/repositories/article.js', () => ({
  listArticles: state.listArticles,
  listBookmarkedArticlesOfUser: state.listBookmarks,
  getArticleSummaryById: vi.fn(),
}));

vi.mock('#lib/server/use-cases/article.js', () => ({
  getEditableArticle: state.editable,
  saveMarkdownArticle: vi.fn(),
}));

import { loadPageData as home } from './page.remote';
import { loadLayoutData as consoleLayout } from './console/layout.remote';
import { loadPageData as editor } from './a/[articleId]/edit/page.remote';
import { loadPageData as bookmarks } from './console/bookmarks/page.remote';
import { Role } from '#lib/models/role.js';

const actor = {
  id: 'trusted',
  username: 'trusted',
  name: 'Trusted',
  githubId: null,
  aboutMe: '',
  verifyCode: '',
  roles: [Role.ArticleAuthor],
};

beforeEach(() => {
  vi.clearAllMocks();
  state.event.locals = {
    loggedInUser: actor,
    requireLoggedInUser: vi.fn(() => actor),
    requirePermission: vi.fn(() => actor),
    hasPermission: vi.fn(() => true),
  };
  state.listArticles.mockImplementation(async (_db, page) => ({ ...page, count: 0, items: [] }));
});

it.each([
  [null, 1],
  ['garbage', 1],
  ['0', 1],
  ['2tail', 2],
])('parses explicit home page %s using existing behavior', async (value, page) => {
  expect(await home({ page: value })).toEqual({
    page,
    articles: { pageNumber: page, pageSize: 20, count: 0, items: [] },
  });
});

it('rejects a negative page at the remote boundary', async () => {
  await expect(home({ page: '-1' })).rejects.toBeDefined();
});

it('guards each bookmark request without relying on a layout', async () => {
  state.event.locals.requireLoggedInUser = () => {
    throw new Error('unauthorized');
  };
  await expect(bookmarks({ page: 1 })).rejects.toThrow('unauthorized');
  expect(state.listBookmarks).not.toHaveBeenCalled();
});

it('guards the explicit console pathname and redirects disallowed destinations', async () => {
  expect(await consoleLayout({ pathname: '/console/account' })).toMatchObject({ user: actor });
  await expect(consoleLayout({ pathname: '/console' })).rejects.toMatchObject({
    status: 302,
    location: '/console/profile',
  });
  state.event.locals.requireLoggedInUser = () => {
    throw new Error('unauthorized');
  };
  await expect(consoleLayout({ pathname: '/console/account' })).rejects.toThrow('unauthorized');
});

it('authorizes editor reads and uses stored type and content for existing articles', async () => {
  state.editable.mockResolvedValue({
    id: 'saved',
    contentType: 'external',
    title: 'saved title',
    content: 'https://example.test',
  });
  const result = await editor({ articleId: 'saved', contentType: 'markdown', replyTo: null });
  expect(state.editable).toHaveBeenCalledWith({ db: {} }, { actor, articleId: 'saved' });
  expect(result).toMatchObject({
    user: actor,
    contentType: 'external',
    article: { id: 'saved', content: 'https://example.test' },
  });
});
