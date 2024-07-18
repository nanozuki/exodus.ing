import { createMarkdownArticle } from '$lib/server/article';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

interface FormData {
	content?: string;
	error?: string;
}

export const actions = {
	default: async ({ locals, request }): Promise<FormData> => {
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

		const articleId = await createMarkdownArticle(locals, title, content);
		redirect(301, `/a/${articleId}`);
	},
} satisfies Actions;
