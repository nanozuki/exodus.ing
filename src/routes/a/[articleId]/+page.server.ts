import { compile } from '$lib/markdown';
import { getArticle } from '$lib/server/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const article = await getArticle(locals, params.articleId);
	const file = await compile(article.content);
	return {
		article,
		myself: locals.user?.id === article.userId,
		file: file.value,
	};
};
