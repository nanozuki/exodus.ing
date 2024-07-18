import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ parent }) => {
	const pd = await parent();
	if (!pd.user) {
		redirect(302, '/auth');
	}
};
