import type { Handle } from '@sveltejs/kit';
import { Service } from '$lib/server/service';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	let service: Service;
	if (!event.platform) {
		if (dev) {
			const { getPlatformProxy } = await import('wrangler');
			const platform: unknown = await getPlatformProxy();
			service = new Service(platform as App.Platform);
		} else {
			throw new Error('Platform not found');
		}
	} else {
		service = new Service(event.platform);
	}
	event.locals.service = service;
	const sessionId = event.cookies.get(service.lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await service.lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = service.lucia.createSessionCookie(session.id);
		// sveltekit types deviates from the de-facto standard
		// you can use 'as any' too
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}
	if (!session) {
		const sessionCookie = service.lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}
	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};
