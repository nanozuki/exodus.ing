import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { Permission } from '#lib/models/role.js';
import { db, adapters } from '#lib/server/registry.js';
import { saveExternalArticle } from '#lib/server/use-cases/article.js';

/**
 * Creates or updates an external article through `saveExternalArticle`, which verifies the domain's TXT record and owns
 * ownership checks and persistence; the linked page is never fetched. Requires `CreateArticle` and a valid URL; the
 * title may be empty here. An unverified domain, including one that does not exist, becomes a `url` issue, and a
 * PARAMETER_INVALID `title` error a `title` issue; other errors propagate. On success, redirects 303 to the article.
 */
export const createOrUpdateExternalArticle = form(
  z.object({ url: z.url(), title: z.string(), articleId: z.string().optional(), replyToId: z.string().optional() }),
  async ({ url, ...input }, issue) => {
    const actor = getRequestEvent().locals.requirePermission(Permission.CreateArticle, '编辑文章');
    try {
      // Pass the original URL string alongside its parsed value so persistence keeps the submitted text.
      const result = await saveExternalArticle(
        { db, resolveTxt: adapters.name_resolver.resolveTxt },
        { actor, ...input, content: url, url: new URL(url) },
      );
      if (!result.ok) invalid(issue.url('无法验证站点所有权，请按照说明添加 TXT 记录后重试'));
      redirect(303, `/a/${result.articleId}`);
    } catch (error) {
      if (isHttpError(error) && error.body.detail?.tag === 'PARAMETER_INVALID') {
        const fields = error.body.detail.value;
        if (fields.title) invalid(issue.title(fields.title));
      }
      throw error;
    }
  },
);
