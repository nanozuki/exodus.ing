import { Forbidden, Unauthorized } from '$lib/errors';
import { createMarkdownArticle, getArticle, updateMarkdownArticle } from '$lib/server/article';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		error(403, Unauthorized('article editor'));
	}
	if (params.articleId === 'new') {
		return { content: '' };
	}
	const article = await getArticle(locals, params.articleId);
	if (article.userId !== locals.user.id) {
		error(401, Forbidden('article editor'));
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
			error(403, Unauthorized('edit article'));
		}
		if (params.articleId === 'new') {
			const articleId = await createMarkdownArticle(locals, title, content);
			redirect(301, `/a/${articleId}`);
		}

		// Update Article
		const article = await getArticle(locals, params.articleId);
		if (article.userId !== locals.user.id) {
			error(401, Forbidden('edit article'));
		}
		await updateMarkdownArticle(locals, params.articleId, title, content);
		redirect(301, `/a/${params.articleId}`);
	},
} satisfies Actions;
