import { beforeEach, describe, expect, it, vi } from 'vitest';
import { throwError } from '#lib/errors.js';

const mocks = vi.hoisted(() => ({ requireLoggedInUser: vi.fn(), getIdentitiesOfUser: vi.fn() }));

vi.mock('$app/server', () => ({
  form: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'form' } }),
  query: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'query' } }),
  getRequestEvent: () => ({ locals: { requireLoggedInUser: mocks.requireLoggedInUser } }),
}));

vi.mock('#lib/server/registry.js', () => ({ db: { name: 'registry' } }));

vi.mock('#lib/server/repositories/user.js', () => ({ getIdentitiesOfUser: mocks.getIdentitiesOfUser }));

import { loadPageData } from './page.remote';

const load = loadPageData as unknown as () => Promise<{ githubId: string | null }>;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireLoggedInUser.mockReturnValue({ id: 'viewer' });
});

describe('loadPageData', () => {
  it("returns the subject of the viewer's github identity", async () => {
    mocks.getIdentitiesOfUser.mockResolvedValue([{ provider: 'github', subject: '583231', userId: 'viewer' }]);
    expect(await load()).toEqual({ githubId: '583231' });
    expect(mocks.getIdentitiesOfUser).toHaveBeenCalledWith({ name: 'registry' }, 'viewer');
  });

  it('returns null for a viewer without a github identity', async () => {
    mocks.getIdentitiesOfUser.mockResolvedValue([]);
    expect(await load()).toEqual({ githubId: null });
  });

  it('requires login', async () => {
    mocks.requireLoggedInUser.mockImplementation(() => throwError('UNAUTHORIZED', { operation: 'settings' }));
    await expect(load()).rejects.toMatchObject({ status: 401 });
    expect(mocks.getIdentitiesOfUser).not.toHaveBeenCalled();
  });
});
