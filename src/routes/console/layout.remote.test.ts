import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '#lib/models/role.js';

const state = vi.hoisted(() => ({ event: { locals: {} as App.Locals } }));

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

import { loadLayoutData } from './layout.remote';

const actor = {
  id: 'trusted',
  username: 'trusted',
  name: 'Trusted',
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

describe('loadLayoutData', () => {
  it('returns the viewer for a console page their roles allow', async () => {
    expect(await loadLayoutData({ pathname: '/console/account' })).toMatchObject({ user: actor });
  });

  it('redirects a pathname that is not one of the allowed pages to the first one', async () => {
    await expect(loadLayoutData({ pathname: '/console' })).rejects.toMatchObject({
      status: 302,
      location: '/console/profile',
    });
  });

  it('requires login', async () => {
    state.event.locals.requireLoggedInUser = () => {
      throw new Error('unauthorized');
    };
    await expect(loadLayoutData({ pathname: '/console/account' })).rejects.toThrow('unauthorized');
  });
});
