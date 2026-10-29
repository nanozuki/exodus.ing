import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { Permission } from '#lib/models/role.js';
import { db, adapters } from '#lib/server/registry.js';
import { saveExternalArticle } from '#lib/server/use-cases/article.js';

// Pass the original URL string alongside its parsed value so persistence keeps the submitted text.
export const createOrUpdateExternalArticle = form(
  z.object({ url: z.url(), title: z.string(), articleId: z.string().optional(), replyToId: z.string().optional() }),
  async ({ url, ...input }, issue) => {
    const actor = getRequestEvent().locals.requirePermission(Permission.CreateArticle, '编辑文章');
    try {
      const result = await saveExternalArticle(
        { db, resolveTxt: adapters.name_resolver.resolveTxt },
        { actor, ...input, content: url, url: new URL(url) },
      );
      if (!result.ok) invalid(issue.url('无法验证站点所有权，请按照说明添加 TXT 记录后重试'));
      redirect(303, `/a/${result.articleId}`);
    } catch (error) {
      if (isHttpError(error) && error.body.tag === 'PARAMETER_INVALID') {
        const fields = error.body.value as Record<string, string>;
        if (fields.title) invalid(issue.title(fields.title));
      }
      throw error;
    }
  },
);
