import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { Role } from '#lib/models/role.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { getArticleById } from '#lib/server/repositories/article.js';
import { tArticle } from '#lib/server/db/schema.js';
import { getEditableArticle, saveExternalArticle, saveMarkdownArticle, verifyDomainOwnership } from './article';

let database: TestDatabase;
let author: LoggedInUser;
let otherAuthor: LoggedInUser;
let reader: LoggedInUser;

beforeAll(async () => {
  database = await createTestDatabase('use-case-article');
  author = { ...(await findUserByUsername(database.db, 'alice'))!, roles: [Role.ArticleAuthor] };
  reader = { ...(await findUserByUsername(database.db, 'carol'))!, roles: [] };
  otherAuthor = { ...reader, roles: [Role.ArticleAuthor] };
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

async function savedMarkdownArticle(title: string): Promise<string> {
  const result = await saveMarkdownArticle({ db: database.db }, { actor: author, content: `# ${title}\n\nbody` });
  if (!result.ok) throw new Error('expected a saved article');
  return result.articleId;
}

const site = new URL('https://example.test/a');

describe('saveMarkdownArticle', () => {
  it('throws FORBIDDEN for an actor without CreateArticle', async () => {
    await expect(
      saveMarkdownArticle({ db: database.db }, { actor: reader, content: '# Forbidden' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns validation issues without writing', async () => {
    const before = await database.db.$count(tArticle);
    expect(await saveMarkdownArticle({ db: database.db }, { actor: author, content: 'Missing heading' })).toEqual({
      ok: false,
      issues: ['MissingTitle'],
    });
    expect(await database.db.$count(tArticle)).toBe(before);
  });

  it('creates an article titled by the content heading', async () => {
    const result = await saveMarkdownArticle(
      { db: database.db },
      { actor: author, content: '# Titled by heading\n\nbody' },
    );
    if (!result.ok) throw new Error('expected a saved article');
    expect((await getArticleById(database.db, result.articleId)).title).toBe('Titled by heading');
  });

  it("throws BAD_REQUEST when updating another author's article", async () => {
    const articleId = await savedMarkdownArticle('Not yours to edit');
    await expect(
      saveMarkdownArticle({ db: database.db }, { actor: otherAuthor, articleId, content: '# Stolen' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('getEditableArticle', () => {
  it("throws FORBIDDEN for another author's article", async () => {
    const articleId = await savedMarkdownArticle('Not yours to open');
    await expect(getEditableArticle({ db: database.db }, { actor: otherAuthor, articleId })).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe('verifyDomainOwnership', () => {
  it("accepts a TXT record of the URL's hostname that contains the verification token among other text", async () => {
    const resolveTxt = vi.fn(async () => ['prefix exodus-site-verification=correct suffix']);
    expect(await verifyDomainOwnership({ resolveTxt }, { url: site, verificationCode: 'correct' })).toBe(true);
    expect(resolveTxt).toHaveBeenCalledWith('example.test');
  });

  it('propagates resolver failures', async () => {
    const resolveTxt = vi.fn(async (): Promise<string[]> => {
      throw new Error('DNS unavailable');
    });
    await expect(verifyDomainOwnership({ resolveTxt }, { url: site, verificationCode: '' })).rejects.toThrow(
      'DNS unavailable',
    );
  });
});

describe('saveExternalArticle', () => {
  it('returns unverified-domain before loading a missing edit target', async () => {
    const resolveTxt = vi.fn(async () => []);
    expect(
      await saveExternalArticle(
        { db: database.db, resolveTxt },
        { actor: author, articleId: 'absent', title: '', content: site.href, url: site },
      ),
    ).toEqual({ ok: false, reason: 'unverified-domain' });
  });

  it('stores the submitted URL string verbatim as content', async () => {
    const resolveTxt = vi.fn(async () => [`exodus-site-verification=${author.verifyCode}`]);
    const content = 'https://example.test';
    const result = await saveExternalArticle(
      { db: database.db, resolveTxt },
      { actor: author, title: 'Verbatim external', content, url: new URL(content) },
    );
    if (!result.ok) throw new Error('expected a saved article');
    expect((await getArticleById(database.db, result.articleId)).content).toBe(content);
  });
});
