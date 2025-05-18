import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { consoleDefaultRoute } from './routes';

export const load: PageServerLoad = async () => {
  redirect(301, consoleDefaultRoute.route);
};
