import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { Role } from '#lib/models/role.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { findSessionById, createSession as persistSession } from '#lib/server/repositories/session.js';
import { getArticleById } from '#lib/server/repositories/article.js';
import { tArticle } from '#lib/server/db/schema.js';
import { createSession, validateSession } from './session';
import { getEditableArticle, saveExternalArticle, saveMarkdownArticle, verifyDomainOwnership } from './article';
import { saveComment } from './comment';
import { getInviteQuota, createInviteCode, acceptInviteCode } from './invite_code';
import { loginWithGitHub, updateUsername, validateSignUp } from './user';
import type { LoggedInUser } from '#lib/models/user.js';

vi.mock('#lib/server/repositories/utils.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#lib/server/repositories/utils.js')>();
  let sequence = 0;
  return {
    ...actual,
    newNanoId: () => `t${String(++sequence).padStart(5, '0')}`,
    newCode: () => `test${String(++sequence).padStart(12, '0')}`,
    newVerifyCode: () => 'v'.repeat(32),
  };
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-07-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

let database: TestDatabase;
let author: LoggedInUser;
let reader: LoggedInUser;

beforeAll(async () => {
  database = await createTestDatabase('use-case-contracts');
  author = { ...(await findUserByUsername(database.db, 'alice'))!, roles: [Role.ArticleAuthor] };
  reader = { ...(await findUserByUsername(database.db, 'carol'))!, roles: [] };
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

const instant = new Date('2026-06-01T00:00:00Z');
const day = 86400000;

describe('session policy with an injected clock and real persistence', () => {
  it('reads the clock and generator once, preserving the persisted result', async () => {
    const now = vi.fn(() => instant);
    const generateSessionId = vi.fn(() => 'injected-session');
    const session = await createSession({ db: database.db, now, generateSessionId }, { userId: author.id });
    expect(session.expiresAt).toEqual(new Date(+instant + 30 * day));
    expect(now).toHaveBeenCalledTimes(1);
    expect(generateSessionId).toHaveBeenCalledTimes(1);
    expect(await findSessionById(database.db, session.id)).toEqual(session);
  });
  it.each([
    [-1, null],
    [0, null],
    [1, true],
    [20 * day, true],
    [20 * day + 1, false],
  ])('handles the expiry/renewal boundary %i', async (remaining, refresh) => {
    const id = `boundary-${remaining}`;
    await persistSession(database.db, { id, userId: author.id, expiresAt: new Date(+instant + remaining) });
    const now = vi.fn(() => instant);
    const result = await validateSession({ db: database.db, now }, { sessionId: id });
    expect(now).toHaveBeenCalledTimes(1);
    if (refresh === null) {
      expect(result).toBeNull();
      expect(await findSessionById(database.db, id)).toBeNull();
    } else {
      expect(result?.refresh).toBe(refresh);
      expect(result?.session).toEqual(await findSessionById(database.db, id));
      expect(result?.session.expiresAt).toEqual(new Date(+instant + (refresh ? 30 * day : remaining)));
    }
  });
  it('returns null for an unknown session', async () => {
    expect(await validateSession({ db: database.db, now: () => instant }, { sessionId: 'missing' })).toBeNull();
  });
});

describe('business operations', () => {
  it('enforces article permissions before writes and returns Markdown validation issues', async () => {
    const deps = { db: database.db };
    await expect(saveMarkdownArticle(deps, { actor: reader, content: '# Forbidden' })).rejects.toMatchObject({
      status: 403,
    });
    const before = await database.db.$count(tArticle);
    expect(await saveMarkdownArticle(deps, { actor: author, content: 'Missing heading' })).toEqual({
      ok: false,
      issues: ['MissingTitle'],
    });
    expect(await database.db.$count(tArticle)).toBe(before);
    const result = await saveMarkdownArticle(deps, { actor: author, content: '# Contract Markdown\n\nbody' });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected a saved article');
    expect((await getArticleById(database.db, result.articleId)).title).toBe('Contract Markdown');
    await expect(
      getEditableArticle(deps, { actor: { ...reader, roles: [Role.ArticleAuthor] }, articleId: result.articleId }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      saveMarkdownArticle(deps, {
        actor: { ...reader, roles: [Role.ArticleAuthor] },
        articleId: result.articleId,
        content: '# Stolen',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('uses mocked DNS, verifies before ownership lookup, and preserves original URL text', async () => {
    const resolveTxt = vi.fn(async () => ['prefix exodus-site-verification=correct suffix']);
    expect(
      await verifyDomainOwnership(
        { resolveTxt },
        { url: new URL('https://example.test/a'), verificationCode: 'correct' },
      ),
    ).toBe(true);
    expect(resolveTxt).toHaveBeenCalledWith('example.test');
    resolveTxt.mockResolvedValue([]);
    expect(
      await saveExternalArticle(
        { db: database.db, resolveTxt },
        {
          actor: author,
          articleId: 'absent',
          title: '',
          content: 'https://example.test',
          url: new URL('https://example.test'),
        },
      ),
    ).toEqual({ ok: false, reason: 'unverified-domain' });
    resolveTxt.mockResolvedValue([`exodus-site-verification=${author.verifyCode}`]);
    const result = await saveExternalArticle(
      { db: database.db, resolveTxt },
      {
        actor: author,
        title: 'Contract external',
        content: 'https://example.test',
        url: new URL('https://example.test'),
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect((await getArticleById(database.db, result.articleId)).content).toBe('https://example.test');
    resolveTxt.mockRejectedValue(new Error('DNS unavailable'));
    await expect(
      verifyDomainOwnership({ resolveTxt }, { url: new URL('https://example.test'), verificationCode: '' }),
    ).rejects.toThrow('DNS unavailable');
  });

  it('keeps comment edits on their stored article and rejects another actor', async () => {
    const created = await saveComment(
      { db: database.db },
      { actor: reader, articleId: 'A21', content: 'contract comment' },
    );
    expect(
      await saveComment(
        { db: database.db },
        { actor: reader, articleId: 'A01', commentId: created.commentId, content: 'edited' },
      ),
    ).toEqual(created);
    await expect(
      saveComment({ db: database.db }, { actor: author, commentId: created.commentId, content: 'stolen' }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(saveComment({ db: database.db }, { actor: reader, content: 'no article' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('calculates quota, scopes permission, and redeems using one supplied instant', async () => {
    const db = database.db;
    await expect(createInviteCode({ db }, { actor: reader })).rejects.toMatchObject({ status: 403 });
    const before = await getInviteQuota({ db }, { userId: author.id });
    const invite = await createInviteCode({ db }, { actor: author });
    expect(await getInviteQuota({ db }, { userId: author.id })).toBe(before - 1);
    const now = vi.fn(() => instant);
    await acceptInviteCode({ db, now }, { actor: reader, code: invite.code });
    expect(now).toHaveBeenCalledTimes(1);
    await expect(acceptInviteCode({ db, now }, { actor: reader, code: invite.code })).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码已被使用' } } },
    });
    await expect(acceptInviteCode({ db, now }, { actor: reader, code: 'absent' })).rejects.toMatchObject({
      status: 400,
      body: { detail: { tag: 'PARAMETER_INVALID', value: { inviteCode: '邀请码不存在' } } },
    });
  });

  it('validates identities and reuses a GitHub account without overwriting profile', async () => {
    const db = database.db;
    await expect(validateSignUp({ db }, { username: '@invalid' })).rejects.toMatchObject({
      body: { detail: { tag: 'PARAMETER_INVALID' } },
    });
    await expect(validateSignUp({ db }, { username: author.username })).rejects.toMatchObject({ status: 400 });
    await expect(validateSignUp({ db }, { name: author.name })).rejects.toMatchObject({ status: 400 });
    await updateUsername({ db }, { actor: author, username: author.username });
    const deps = {
      db,
      now: () => instant,
      generateSessionId: vi.fn().mockReturnValueOnce('github-first').mockReturnValueOnce('github-second'),
    };
    const first = await loginWithGitHub(deps, {
      githubUser: { id: 987654, username: 'contract-github' },
      signUp: { name: 'Contract GitHub' },
    });
    const second = await loginWithGitHub(deps, {
      githubUser: { id: 987654, username: 'different' },
      signUp: { username: 'overwrite' },
    });
    expect(second.userId).toBe(first.userId);
    expect(await findUserByUsername(db, 'overwrite')).toBeNull();
    expect(await findUserByUsername(db, 'contract-github')).toMatchObject({
      id: first.userId,
      name: 'Contract GitHub',
      aboutMe: '',
    });
  });
});
