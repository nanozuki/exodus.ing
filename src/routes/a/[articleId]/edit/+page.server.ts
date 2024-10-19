import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (params.articleId === 'new') {
    locals.layouts.requireLoggedInUser('load article editor');
    return { title: '', content: '' };
  }
  return await locals.articleEditPage.getArticleContent(params.articleId);
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
    if (params.articleId === 'new') {
      const articleId = await locals.articleEditPage.createByMarkdown(content);
      redirect(301, `/a/${articleId}`);
    }

    // Update Article
    await locals.articleEditPage.updateByMarkdown(params.articleId, content);
    redirect(301, `/a/${params.articleId}`);
  },
} satisfies Actions;
