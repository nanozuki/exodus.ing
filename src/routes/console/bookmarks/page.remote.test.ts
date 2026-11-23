import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '#lib/models/role.js';

const state = vi.hoisted(() => ({ event: { locals: {} as App.Locals }, listBookmarks: vi.fn() }));

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
vi.mock('#lib/server/repositories/article.js', () => ({ listBookmarkedArticlesOfUser: state.listBookmarks }));

import { loadPageData } from './page.remote';

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
});

describe('loadPageData', () => {
  it('requires login on every request, without relying on a layout', async () => {
    state.event.locals.requireLoggedInUser = () => {
      throw new Error('unauthorized');
    };
    await expect(loadPageData({ page: 1 })).rejects.toThrow('unauthorized');
    expect(state.listBookmarks).not.toHaveBeenCalled();
  });
});
