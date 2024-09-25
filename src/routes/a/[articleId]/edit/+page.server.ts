import { AppError } from '$lib/errors';
import { createMarkdownArticle, getArticle, updateMarkdownArticle } from '$lib/server/article';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    return AppError.Unauthorized('article editor').throw();
  }
  if (params.articleId === 'new') {
    return { content: '' };
  }
  const article = await getArticle(locals, params.articleId);
  if (article.userId !== locals.user.id) {
    return AppError.Forbidden('article editor').throw();
  }
  return {
    content: article.content,
    title: article.title,
  };
};

interface FormData {
  content?: string;
  error?: string;
}

export const actions = {
  default: async ({ locals, params, request }): Promise<FormData> => {
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    if (typeof title !== 'string' || title.length === 0) {
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

    // New Article
    if (!locals.user) {
      return AppError.Unauthorized('edit article').throw();
    }
    if (params.articleId === 'new') {
      const articleId = await createMarkdownArticle(locals, title, content);
      redirect(301, `/a/${articleId}`);
    }

    // Update Article
    const article = await getArticle(locals, params.articleId);
    if (article.userId !== locals.user.id) {
      return AppError.Forbidden('edit article').throw();
    }
    await updateMarkdownArticle(locals, params.articleId, title, content);
    redirect(301, `/a/${params.articleId}`);
  },
} satisfies Actions;
