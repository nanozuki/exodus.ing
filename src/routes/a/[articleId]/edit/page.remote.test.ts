import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '#lib/models/role.js';

const state = vi.hoisted(() => ({ event: { locals: {} as App.Locals }, editable: vi.fn() }));

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
vi.mock('#lib/server/repositories/article.js', () => ({ getArticleSummaryById: vi.fn() }));
vi.mock('#lib/server/use-cases/article.js', () => ({
  getEditableArticle: state.editable,
  saveMarkdownArticle: vi.fn(),
}));

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
  it('loads an existing article through getEditableArticle with its stored content type', async () => {
    state.editable.mockResolvedValue({
      id: 'saved',
      contentType: 'external',
      title: 'saved title',
      content: 'https://example.test',
    });
    const result = await loadPageData({ articleId: 'saved', contentType: 'markdown', replyTo: null });
    expect(state.editable).toHaveBeenCalledWith({ db: {} }, { actor, articleId: 'saved' });
    expect(result).toMatchObject({
      user: actor,
      contentType: 'external',
      article: { id: 'saved', content: 'https://example.test' },
    });
  });
});
