import type { Article } from '#lib/models/article.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { userHasPermission } from '#lib/models/user.js';
import { Permission } from '#lib/models/role.js';
import { throwError } from '#lib/errors.js';
import { compileArticle, type MarkdownArticleIssue } from '#lib/markdown.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import { getArticleById, createArticle, updateArticle } from '#lib/server/repositories/article.js';

export type SaveMarkdownArticleResult = { ok: true; articleId: string } | { ok: false; issues: MarkdownArticleIssue[] };

export type SaveExternalArticleResult = { ok: true; articleId: string } | { ok: false; reason: 'unverified-domain' };

function requireAuthor(actor: LoggedInUser): void {
  if (!userHasPermission(actor, Permission.CreateArticle)) throwError('FORBIDDEN', { operation: '编辑文章' });
}

// Use for editor reads: another author’s article produces FORBIDDEN.
export async function getEditableArticle(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; articleId: string },
): Promise<Article> {
  requireAuthor(params.actor);
  const article = await getArticleById(deps.db, params.articleId);
  if (article.author.id !== params.actor.id) return throwError('FORBIDDEN', { operation: '编辑其他作者的文章' });
  return article;
}

// Failed validation performs no writes; edits preserve the stored content type and reply parent.
export async function saveMarkdownArticle(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; articleId?: string; content: string; replyToId?: string },
): Promise<SaveMarkdownArticleResult> {
  requireAuthor(params.actor);
  const { title, issues } = await compileArticle(params.content);
  if (issues.length) return { ok: false, issues };
  if (params.articleId) {
    const article = await getArticleById(deps.db, params.articleId);
    if (article.author.id !== params.actor.id) return throwError('BAD_REQUEST', '只能编辑自己的文章');
    await updateArticle(deps.db, { id: params.articleId, title, content: params.content });
    return { ok: true, articleId: params.articleId };
  }
  const article = await createArticle(deps.db, {
    authorId: params.actor.id,
    title,
    content: params.content,
    contentType: 'markdown',
    replyToId: params.replyToId,
  });
  return { ok: true, articleId: article.id };
}

// The marker may occur anywhere in a TXT record; resolver failures propagate.
export async function verifyDomainOwnership(
  deps: { resolveTxt: (hostname: string) => Promise<string[]> },
  params: { url: URL; verificationCode: string },
): Promise<boolean> {
  return (await deps.resolveTxt(params.url.hostname)).some((record) =>
    record.includes(`exodus-site-verification=${params.verificationCode}`),
  );
}

// Domain verification precedes edit-target lookup, preserving form error precedence.
export async function saveExternalArticle(
  deps: { db: AppDatabase; resolveTxt: (hostname: string) => Promise<string[]> },
  params: { actor: LoggedInUser; articleId?: string; url: URL; content: string; title: string; replyToId?: string },
): Promise<SaveExternalArticleResult> {
  requireAuthor(params.actor);
  if (!(await verifyDomainOwnership(deps, { url: params.url, verificationCode: params.actor.verifyCode })))
    return { ok: false, reason: 'unverified-domain' };
  if (params.articleId) {
    const article = await getArticleById(deps.db, params.articleId);
    if (article.author.id !== params.actor.id) return throwError('BAD_REQUEST', '只能编辑自己的文章');
    await updateArticle(deps.db, { id: params.articleId, title: params.title, content: params.content });
    return { ok: true, articleId: params.articleId };
  }
  const article = await createArticle(deps.db, {
    authorId: params.actor.id,
    title: params.title,
    content: params.content,
    contentType: 'external',
    replyToId: params.replyToId,
  });
  return { ok: true, articleId: article.id };
}
