import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { createUser, findUserByIdentity } from '#lib/server/repositories/user.js';
import { validateSession } from '#lib/server/use-cases/session.js';
import { findPreAuthSessionById } from '#lib/server/repositories/pre_auth_session.js';
import { PreAuthPurpose } from '#lib/models/session.js';

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

// The payload of the pending sign-up the callback's pre-auth cookie names.
async function storedPayload(values: Map<string, string>) {
  const [id] = values.get('pre_auth_session')!.split('.');
  return (await findPreAuthSessionById(database.db, id, PreAuthPurpose.SignUp))?.payload;
}

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
    const session = await validateSession({ db: database.db, clock: { now } }, { token: values.get('auth_session')! });
    expect(session?.session.userId).toBe(user.id);
    expect(values.has('pre_auth_session')).toBe(false);
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
    expect(await storedPayload(values)).toEqual({
      identity: { provider: 'github', subject: '9002' },
      hints: { username: 'newcomer', name: 'New Comer' },
      next: '/console',
    });
  });

  it('leaves the name hint out when the GitHub profile has no name', async () => {
    state.getUser.mockResolvedValue({ id: 9003, username: 'nameless', name: null });
    const { event, values } = callback();

    await GET(event);

    expect((await storedPayload(values))?.hints).toEqual({ username: 'nameless' });
  });

  it('redirects a signed-in identity with a non-path next to the app home page', async () => {
    await createUser(database.db, {
      username: 'returning-unsafe',
      name: 'Returning Unsafe',
      aboutMe: '',
      identity: { provider: 'github', subject: '9100' },
    });
    state.getUser.mockResolvedValue({ id: 9100, username: 'x', name: null });
    const response = await GET(callback('https://evil.example').event);
    expect(response.headers.get('location')).toBe('https://exodus.test/');
  });

  it('propagates a provider failure without setting session cookies', async () => {
    const failure = new Error('offline');
    state.getUser.mockRejectedValue(failure);
    const { event, values } = callback();

    await expect(GET(event)).rejects.toBe(failure);
    expect(values.has('auth_session')).toBe(false);
    expect(values.has('pre_auth_session')).toBe(false);
  });
});
