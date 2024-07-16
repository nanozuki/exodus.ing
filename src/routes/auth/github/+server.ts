import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';

import type { RequestEvent } from '@sveltejs/kit';
import { Service } from '$lib/server/service';

export async function GET(event: RequestEvent): Promise<Response> {
	if (!event.platform) {
		throw new Error('event.platform is not found');
	}
	const service = new Service(event.platform);
	const state = generateState();
	const url = await service.github.createAuthorizationURL(state);

	console.log('url: ', url);
	event.cookies.set('github_oauth_state', state, {
		path: '/',
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
	});

	redirect(302, url.toString());
}
