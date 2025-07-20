import type { ArticleCard, ArticleContent, ArticleContentType } from '$lib/domain/entities/article';
import { services } from '$lib/server/registry';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Permission } from '$lib/domain/entities/role';

function parseContentType(url: URL): ArticleContentType | null {
  const contentType = url.searchParams.get('contentType');
  return contentType === 'markdown' || contentType === 'external' ? contentType : null;
}

type PageData =
  | {
      action: 'create';
      contentType: ArticleContentType | null;
      replyTo?: ArticleCard;
    }
  | {
      action: 'update';
      article: ArticleContent;
      replyTo?: ArticleCard;
    };

export const load: PageServerLoad = async ({ locals, params, url }): Promise<PageData> => {
  await locals.requirePermission(Permission.CreateArticle, 'load article editor');
  let replyTo: ArticleCard | undefined;
  if (url.searchParams.has('replyTo')) {
    replyTo = await services.article.getCardById(url.searchParams.get('replyTo')!);
  }
  const articleId = params.articleId;
  if (articleId === 'new') {
    return {
      action: 'create',
      contentType: parseContentType(url),
      replyTo,
    };
  }
  const article = await services.article.getContentById(articleId);
  return {
    action: 'update',
    article,
    replyTo,
  };
};

interface FormData {
  content?: string;
  error?: string;
}

export const actions = {
  default: async ({ locals, params, request }): Promise<FormData> => {
    const user = await locals.requirePermission(Permission.CreateArticle, 'load article editor');
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const replyTo = data.get('replyTo') || undefined;
    if (typeof title !== 'string' || title.length === 0 || title === '无标题') {
      return {
        content: typeof content === 'string' ? content : undefined,
        error: '标题不能为空',
      };
    }
    if (typeof content !== 'string' || content.length === 0) {
      return {
        content: typeof content === 'string' ? content : undefined,
        error: '内容不能为空',
      };
    }
    if (typeof replyTo !== 'string' && typeof replyTo !== 'undefined') {
      return {
        content: typeof content === 'string' ? content : undefined,
        error: '必须是字符串',
      };
    }

    // New Article
    if (params.articleId === 'new') {
      const articleId = await services.article.createByMarkdown(user.id, content, replyTo);
      redirect(301, `/a/${articleId}`);
    }

    // Update Article
    await services.article.updateByMarkdown(user.id, params.articleId, content);
    redirect(301, `/a/${params.articleId}`);
  },
} satisfies Actions;
