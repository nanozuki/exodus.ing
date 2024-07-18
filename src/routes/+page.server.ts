import { listArticles } from '$lib/server/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const articles = await listArticles(locals, 10, 0);
	return {
		articles: articles,
	};
};
