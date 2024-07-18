import { listArticlesByUserId } from '$lib/server/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const articles = await listArticlesByUserId(locals, userId, 10, 0);
	return {
		articles: articles,
	};
};
