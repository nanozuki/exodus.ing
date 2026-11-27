import type { Article } from '#lib/models/article.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { userHasPermission } from '#lib/models/user.js';
import { Permission } from '#lib/models/role.js';
import { throwError } from '#lib/errors.js';
import { compileArticle, type MarkdownArticleIssue } from '#lib/markdown.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import type { NameResolver } from '#lib/server/adapters/name_resolver.js';
import { getArticleById, createArticle, updateArticle } from '#lib/server/repositories/article.js';

/** A rejected document is a validation result, not an error; the remote maps `issues` to its `content` field. */
export type SaveMarkdownArticleResult = { ok: true; articleId: string } | { ok: false; issues: MarkdownArticleIssue[] };

/**
 * `unverified-domain` means the actor's verification code is missing from the URL host's TXT records; nothing was
 * written. The remote supplies the URL field's message.
 */
export type SaveExternalArticleResult = { ok: true; articleId: string } | { ok: false; reason: 'unverified-domain' };

function requireAuthor(actor: LoggedInUser): void {
  if (!userHasPermission(actor, Permission.CreateArticle)) throwError('FORBIDDEN', { operation: '编辑文章' });
}

/**
 * Loads an article for its author's editor. Requires `CreateArticle`; another author's article throws FORBIDDEN and a
 * missing one NOT_FOUND. Route and search-parameter parsing stay with the caller.
 */
export async function getEditableArticle(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; articleId: string },
): Promise<Article> {
  requireAuthor(params.actor);
  const article = await getArticleById(deps.db, params.articleId);
  if (article.author.id !== params.actor.id) return throwError('FORBIDDEN', { operation: '编辑其他作者的文章' });
  return article;
}

/**
 * Requires `CreateArticle`. Compiles `content` and takes the title from it; validation issues return `ok: false`
 * without writes. With `articleId`, updates the title and content of the actor's own article, keeping its stored
 * content type and reply parent; another author's article throws BAD_REQUEST. Without it, creates a Markdown article
 * by the actor, replying to `replyToId` when given.
 */
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

/**
 * Reports whether any TXT record of `url.hostname` contains `exodus-site-verification=<verificationCode>`, anywhere in
 * the record. Resolver failures propagate. URL parsing and actor authorization stay with the caller.
 */
export async function verifyDomainOwnership(
  deps: { nameResolver: NameResolver },
  params: { url: URL; verificationCode: string },
): Promise<boolean> {
  return (await deps.nameResolver.resolveTxt(params.url.hostname)).some((record) =>
    record.includes(`exodus-site-verification=${params.verificationCode}`),
  );
}

/**
 * Saves an article that links to an external page. `content` is the submitted URL string, stored verbatim; `url` is
 * parsed from that same string by the caller. Requires `CreateArticle`. Returns `unverified-domain` without writes
 * when `verifyDomainOwnership` fails for the actor's verification code; this check runs before any edit target is
 * loaded, so its error takes precedence. With `articleId`, updates the title and content of the actor's own article;
 * another author's article throws BAD_REQUEST. Without it, creates an external article by the actor, replying to
 * `replyToId` when given.
 */
export async function saveExternalArticle(
  deps: { db: AppDatabase; nameResolver: NameResolver },
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
