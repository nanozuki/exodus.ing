import { AppError } from '$lib/errors';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = locals.auth.requireLoggedInUser('load article editor');
  if (params.articleId === 'new') {
    return { content: '' };
  }
  const article = await locals.article.getArticle(params.articleId);
  if (article.author.userId !== user.id) {
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

    const user = locals.auth.requireLoggedInUser('edit article');
    // New Article
    if (params.articleId === 'new') {
      const articleId = await locals.article.createMarkdownArticle(user.id, title, content);
      redirect(301, `/a/${articleId}`);
    }

    // Update Article
    await locals.article.updateMarkdownArticle(user.id, params.articleId, title, content);
    redirect(301, `/a/${params.articleId}`);
  },
} satisfies Actions;
