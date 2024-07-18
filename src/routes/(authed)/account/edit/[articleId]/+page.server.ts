import { getArticle } from '$lib/server/article';
import type { PageServerLoad } from './$types';
import { updateMarkdownArticle } from '$lib/server/article';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const article = await getArticle(locals, params.articleId);
	return { article };
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

		await updateMarkdownArticle(locals, params.articleId, title, content);
		redirect(301, `/a/${params.articleId}`);
	},
} satisfies Actions;
