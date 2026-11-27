import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { createUser, findUserByIdentity } from '#lib/server/repositories/user.js';
import { validateSession } from '#lib/server/use-cases/session.js';
import { signInWithIdentity } from '#lib/server/use-cases/user.js';
import { random } from '#lib/server/adapters/random.js';
import { getRolesOfUser } from '#lib/server/repositories/role.js';
import { findPreAuthSessionById } from '#lib/server/repositories/pre_auth_session.js';
import { PreAuthPurpose } from '#lib/models/session.js';

const state = vi.hoisted(() => ({ db: undefined as unknown, cookies: undefined as unknown, setLayout: vi.fn() }));

vi.mock('$app/server', () => ({
  form: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'form' } }),
  query: (...args: unknown[]) => Object.assign(args.at(-1) as object, { __: { type: 'query' } }),
  getRequestEvent: () => ({ cookies: state.cookies }),
}));
vi.mock('#lib/server/registry.js', () => ({
  get db() {
    return state.db;
  },
}));
vi.mock('../../layout.remote', () => ({ loadLayoutData: () => ({ set: state.setLayout }) }));
vi.mock('#lib/server/config.js', () => ({ getConfig: () => ({ appUrl: 'https://exodus.test' }) }));

import { cancelSignUp, loadPageData, submitSignUp } from './page.remote';

type Fields = { username: string; name: string };
type Issue = { [K in keyof Fields]: ReturnType<typeof vi.fn> };
const load = loadPageData as unknown as () => Promise<Fields>;
const submit = submitSignUp as unknown as (input: Fields, issue: Issue) => Promise<never>;
const cancel = cancelSignUp as unknown as () => Promise<never>;

let database: TestDatabase;
let values: Map<string, string>;

beforeAll(async () => {
  database = await createTestDatabase('sign-up-page');
  state.db = database.db;
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

beforeEach(() => {
  values = new Map();
  state.setLayout.mockClear();
  state.cookies = {
    get: (name: string) => values.get(name),
    set: (name: string, value: string) => void values.set(name, value),
    delete: (name: string) => void values.delete(name),
  } as unknown as Cookies;
});

// Starts a pending sign-up as the OAuth callback does and stores its token in the sign-up cookie.
async function pendingSignUp(subject: string, next?: string) {
  const result = await signInWithIdentity(
    { db: database.db, clock: { now: () => new Date() }, random },
    { identity: { provider: 'github', subject }, hints: { username: `login-${subject}`, name: 'GitHub Name' }, next },
  );
  if (result.status !== 'sign_up_required') throw new Error('expected a pending sign-up');
  values.set('pre_auth_session', result.token);
  return result.token;
}

function issue(): Issue {
  return {
    username: vi.fn((message: string) => ({ path: ['username'], message })),
    name: vi.fn((message: string) => ({ path: ['name'], message })),
  };
}

const toAuth = { status: 303, location: '/auth' };
const github605 = { provider: 'github' as const, subject: '605' };

describe('loadPageData', () => {
  it('returns the prefill of the pending sign-up', async () => {
    await pendingSignUp('500');
    expect(await load()).toEqual({ username: 'login-500', name: 'GitHub Name' });
  });

  it.each([undefined, 'absent.secret'])('redirects the cookie %j to /auth without writing cookies', async (token) => {
    if (token) values.set('pre_auth_session', token);
    const cookies = state.cookies as { set: unknown; delete: unknown };
    cookies.set = cookies.delete = () => {
      throw new Error('a query cannot write cookies');
    };
    await expect(load()).rejects.toMatchObject({ status: 302, location: '/auth' });
  });
});

describe('submitSignUp', () => {
  it('creates the account, swaps the sign-up cookie for a session, sets the viewer, and returns to next', async () => {
    await pendingSignUp('600', '/console');
    await expect(submit({ username: 'page-user', name: 'Page User' }, issue())).rejects.toMatchObject({
      status: 303,
      location: 'https://exodus.test/console',
    });
    const user = await findUserByIdentity(database.db, { provider: 'github', subject: '600' });
    expect(user).toMatchObject({ username: 'page-user', name: 'Page User' });
    const session = await validateSession(
      { db: database.db, clock: { now: () => new Date() } },
      { token: values.get('auth_session')! },
    );
    expect(session?.session.userId).toBe(user!.id);
    expect(values.has('pre_auth_session')).toBe(false);
    expect(state.setLayout).toHaveBeenCalledExactlyOnceWith({
      user: { ...user, roles: await getRolesOfUser(database.db, user!.id) },
    });
  });

  it('redirects a non-path next to the app home page', async () => {
    await pendingSignUp('601', 'https://evil.example');
    await expect(submit({ username: 'page-safe', name: 'Page Safe' }, issue())).rejects.toMatchObject({
      location: 'https://exodus.test/',
    });
  });

  it('reports a taken username on its field and keeps the pending sign-up', async () => {
    await pendingSignUp('602');
    const issues = issue();
    await expect(submit({ username: 'alice', name: 'Not Alice' }, issues)).rejects.toMatchObject({
      issues: [{ path: ['username'], message: '用户名已存在' }],
    });
    expect(values.has('pre_auth_session')).toBe(true);
    expect(state.setLayout).not.toHaveBeenCalled();
  });

  it('reports a taken name on its field', async () => {
    await pendingSignUp('604');
    await expect(submit({ username: 'page-name-taken', name: 'Alice' }, issue())).rejects.toMatchObject({
      issues: [{ path: ['name'], message: '昵称已存在' }],
    });
  });

  it('propagates other failures and keeps the pending sign-up', async () => {
    await pendingSignUp('605');
    await createUser(database.db, { username: 'owner-605', name: 'Owner 605', aboutMe: '', identity: github605 });
    await expect(submit({ username: 'page-raced', name: 'Page Raced' }, issue())).rejects.toMatchObject({
      body: { detail: { tag: 'DATABASE_ERROR' } },
    });
    expect(values.has('pre_auth_session')).toBe(true);
    expect(values.has('auth_session')).toBe(false);
  });

  it('deletes a cookie naming no live pending sign-up and returns to /auth', async () => {
    values.set('pre_auth_session', 'absent.secret');
    await expect(submit({ username: 'no-pending', name: 'No Pending' }, issue())).rejects.toMatchObject(toAuth);
    expect(values.has('pre_auth_session')).toBe(false);
    expect(values.has('auth_session')).toBe(false);
    expect(state.setLayout).not.toHaveBeenCalled();
  });

  it('returns to /auth without a sign-up cookie', async () => {
    await expect(submit({ username: 'no-cookie', name: 'No Cookie' }, issue())).rejects.toMatchObject(toAuth);
    expect(values.has('auth_session')).toBe(false);
    expect(state.setLayout).not.toHaveBeenCalled();
  });
});

describe('cancelSignUp', () => {
  it('ends the pending sign-up its cookie names, deletes the cookie, and returns to /auth', async () => {
    const [id] = (await pendingSignUp('700')).split('.');
    await expect(cancel()).rejects.toMatchObject(toAuth);
    expect(values.has('pre_auth_session')).toBe(false);
    expect(await findPreAuthSessionById(database.db, id, PreAuthPurpose.SignUp)).toBeNull();
  });

  it('returns to /auth without a sign-up cookie', async () => {
    await expect(cancel()).rejects.toMatchObject(toAuth);
  });
});
