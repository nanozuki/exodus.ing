import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { createUser, findUserByIdentity } from '#lib/server/repositories/user.js';
import { validateSession } from '#lib/server/use-cases/session.js';
import { fetchSignUpPrefill } from '#lib/server/use-cases/user.js';

const state = vi.hoisted(() => ({ db: undefined as unknown, getUser: vi.fn() }));

vi.mock('#lib/server/registry.js', () => ({
  get db() {
    return state.db;
  },
  adapters: { githubOAuth: { getUser: state.getUser } },
}));
vi.mock('#lib/server/config.js', () => ({ getConfig: () => ({ appUrl: 'https://exodus.test' }) }));

import { GET } from './+server';

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase('callback');
  state.db = database.db;
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

beforeEach(() => {
  state.getUser.mockReset();
});

// A callback request whose state cookie matches its query, as after `createGitHubAuthUrl`.
function callback(next?: string) {
  const values = new Map<string, string>([['github_oauth_state', JSON.stringify({ state: 'state', next })]]);
  const cookies = {
    get: (name: string) => values.get(name),
    set: (name: string, value: string) => void values.set(name, value),
    delete: (name: string) => void values.delete(name),
  } as unknown as Cookies;
  const url = new URL('https://exodus.test/auth/github/callback?code=code&state=state');
  return { event: { cookies, url } as RequestEvent, values };
}

const now = () => new Date();

describe('GET', () => {
  it('signs a known GitHub identity in and redirects to next', async () => {
    const user = await createUser(database.db, {
      username: 'returning',
      name: 'Returning',
      aboutMe: '',
      identity: { provider: 'github', subject: '9001' },
    });
    state.getUser.mockResolvedValue({ id: 9001, username: 'renamed-login', name: 'Renamed' });
    const { event, values } = callback('/console');

    const response = await GET(event);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://exodus.test/console');
    const session = await validateSession({ db: database.db, now }, { token: values.get('auth_session')! });
    expect(session?.session.userId).toBe(user.id);
    expect(values.has('sign_up_session')).toBe(false);
    expect(values.has('github_oauth_state')).toBe(false);
  });

  it('sends an unknown GitHub identity to the sign-up page without creating a user', async () => {
    state.getUser.mockResolvedValue({ id: 9002, username: 'newcomer', name: 'New Comer' });
    const { event, values } = callback('/console');

    const response = await GET(event);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://exodus.test/auth/sign-up');
    expect(values.has('auth_session')).toBe(false);
    expect(await findUserByIdentity(database.db, { provider: 'github', subject: '9002' })).toBeNull();
    const prefill = await fetchSignUpPrefill({ db: database.db, now }, { token: values.get('sign_up_session')! });
    expect(prefill).toEqual({ username: 'newcomer', name: 'New Comer' });
  });

  it('prefills the name from the login when the GitHub profile has none', async () => {
    state.getUser.mockResolvedValue({ id: 9003, username: 'nameless', name: null });
    const { event, values } = callback();

    await GET(event);

    const prefill = await fetchSignUpPrefill({ db: database.db, now }, { token: values.get('sign_up_session')! });
    expect(prefill).toEqual({ username: 'nameless', name: 'nameless' });
  });

  it.each(['@evil.example', 'https://evil.example'])(
    'redirects a signed-in identity with next %j to the app home page',
    async (next) => {
      await createUser(database.db, {
        username: `returning-${next.length}`,
        name: `Returning ${next.length}`,
        aboutMe: '',
        identity: { provider: 'github', subject: `9100${next.length}` },
      });
      state.getUser.mockResolvedValue({ id: Number(`9100${next.length}`), username: 'x', name: null });
      const response = await GET(callback(next).event);
      expect(response.headers.get('location')).toBe('https://exodus.test/');
    },
  );

  it('propagates a provider failure without setting session cookies', async () => {
    const failure = new Error('offline');
    state.getUser.mockRejectedValue(failure);
    const { event, values } = callback();

    await expect(GET(event)).rejects.toBe(failure);
    expect(values.has('auth_session')).toBe(false);
    expect(values.has('sign_up_session')).toBe(false);
  });
});
