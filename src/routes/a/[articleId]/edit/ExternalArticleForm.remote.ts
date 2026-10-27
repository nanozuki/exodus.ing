import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { redirect } from '@sveltejs/kit';
import { Permission } from '$lib/models/role';
import { db, adapters } from '$lib/server/registry';
import { saveExternalArticle } from '$lib/server/use-cases/article';
import { throwError } from '$lib/errors';

// Pass the original URL string alongside its parsed value so persistence keeps the submitted text.
export const createOrUpdateExternalArticle = form(
  z.object({ url: z.url(), title: z.string(), articleId: z.string().optional(), replyToId: z.string().optional() }),
  async ({ url, ...input }) => {
    const actor = getRequestEvent().locals.requirePermission(Permission.CreateArticle, '编辑文章');
    const result = await saveExternalArticle(
      { db, resolveTxt: adapters.name_resolver.resolveTxt },
      { actor, ...input, content: url, url: new URL(url) },
    );
    if (!result.ok)
      return throwError('PARAMETER_INVALID', { url: '无法验证站点所有权，请按照说明添加 TXT 记录后重试' });
    redirect(303, `/a/${result.articleId}`);
  },
);
