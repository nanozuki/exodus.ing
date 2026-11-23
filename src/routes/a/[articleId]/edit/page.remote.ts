import { form, getRequestEvent, query } from '$app/server';
import z from 'zod';
import { redirect } from '@sveltejs/kit';
import { Permission } from '#lib/models/role.js';
import type { ArticleContent, ArticleContentType } from '#lib/models/article.js';
import { db } from '#lib/server/registry.js';
import { getArticleSummaryById } from '#lib/server/repositories/article.js';
import { getEditableArticle, saveMarkdownArticle } from '#lib/server/use-cases/article.js';
import { throwArticleIssue } from '#lib/markdown.js';

/**
 * Loads the editor's initial data. Requires `CreateArticle`. Route ID `new` means a new article; any other ID loads
 * the viewer's own article through `getEditableArticle`, so another author's article throws FORBIDDEN and a missing
 * one NOT_FOUND. A nonempty `replyTo` resolves to its article summary or throws NOT_FOUND. The content type is the
 * stored one when editing; for a new article it is `markdown` or `external` from the search parameter, otherwise null.
 */
export const loadPageData = query(
  z.object({ articleId: z.string(), replyTo: z.string().nullable(), contentType: z.string().nullable() }),
  async (input) => {
    const user = getRequestEvent().locals.requirePermission(Permission.CreateArticle, '编辑文章');
    const articleId = input.articleId === 'new' ? undefined : input.articleId;
    const stored = articleId ? await getEditableArticle({ db }, { actor: user, articleId }) : undefined;
    const article: ArticleContent | undefined = stored
      ? { id: stored.id, title: stored.title, content: stored.content, contentType: stored.contentType }
      : undefined;
    const replyToId = input.replyTo || undefined;
    const replyTo = replyToId ? await getArticleSummaryById(db, replyToId) : undefined;
    const contentType: ArticleContentType | null =
      stored?.contentType ??
      (input.contentType === 'markdown' || input.contentType === 'external' ? input.contentType : null);
    return { user, articleId, replyToId, article, replyTo, contentType };
  },
);

/**
 * Creates or updates a Markdown article through `saveMarkdownArticle`, which owns compilation, ownership checks, and
 * persistence. Requires `CreateArticle` and nonempty source. The first compilation issue becomes a PARAMETER_INVALID
 * error on `content`. On success, redirects 303 to the article.
 */
export const createOrUpdateMarkdownArticle = form(
  z.object({ content: z.string().min(1), articleId: z.string().optional(), replyToId: z.string().optional() }),
  async (input) => {
    const actor = getRequestEvent().locals.requirePermission(Permission.CreateArticle, '编辑文章');
    const result = await saveMarkdownArticle({ db }, { actor, ...input });
    if (!result.ok) return throwArticleIssue(result.issues[0], 'content');
    redirect(303, `/a/${result.articleId}`);
  },
);
