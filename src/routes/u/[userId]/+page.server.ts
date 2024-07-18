import { listArticlesByUserId } from '$lib/server/article';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Unauthorized } from '$lib/errors';
import { getUserById, updateUsername } from '$lib/server/user';

export const load: PageServerLoad = async ({ locals, params }) => {
	const articles = await listArticlesByUserId(locals, params.userId, 10, 0);
	if (params.userId === locals.user?.id) {
		return {
			articles: articles,
			myself: true,
			user: locals.user,
		};
	}
	const user = await getUserById(locals, params.userId);
	return {
		articles: articles,
		myself: params.userId === locals.user?.id,
		user: user,
	};
};

interface FormData {
	username?: string;
	error?: string;
}

export const actions = {
	default: async ({ locals, request }): Promise<FormData> => {
		const userId = locals.user?.id;
		if (!userId) {
			return error(401, Unauthorized('update username'));
		}
		const data = await request.formData();
		const username = data.get('username');
		if (typeof username !== 'string') {
			return { error: '用户名不能为空' };
		}
		if (username.length === 0) {
			return {
				username: typeof username === 'string' ? username : undefined,
				error: '用户名不能为空',
			};
		} else if (username === locals.user!.username) {
			return { username };
		}

		try {
			await updateUsername(locals, userId, username);
		} catch (e) {
			if (e instanceof Error) {
				return {
					username: typeof username === 'string' ? username : undefined,
					error: e.message,
				};
			}
			return {
				username: typeof username === 'string' ? username : undefined,
				error: JSON.stringify(e),
			};
		}
		redirect(301, `/u/${userId}`);
	},
} satisfies Actions;
