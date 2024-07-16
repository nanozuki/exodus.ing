// import { OAuth2RequestError } from 'arctic';
import { generateIdFromEntropySize } from 'lucia';

import type { RequestEvent } from '@sveltejs/kit';
import * as schema from '$lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(event: RequestEvent): Promise<Response> {
	const service = event.locals.service;
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400,
		});
	}

	// try {
	const tokens = await service.github.validateAuthorizationCode(code);
	const githubUserResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken}`,
		},
	});
	const githubUser: GitHubUser = await githubUserResponse.json();

	// Replace this with your own DB client.
	// const existingUser = await service.db.query.user.findFirst({
	// 	with: { githubId: githubUser.id },
	// });
	const users =
		(await service.db.select().from(schema.user).where(eq(schema.user.githubId, githubUser.id))) ||
		[];
	const existingUser = users[0];

	if (existingUser) {
		const session = await service.lucia.createSession(existingUser.id, {});
		const sessionCookie = service.lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	} else {
		const userId = generateIdFromEntropySize(10); // 16 characters long
		const now = new Date();

		await service.db.insert(schema.user).values({
			id: userId,
			createdAt: now,
			updatedAt: now,
			username: githubUser.login,
			githubId: githubUser.id,
		});

		const session = await service.lucia.createSession(userId, {});
		const sessionCookie = service.lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/',
		},
	});
	// } catch (e) {
	// 	// the specific error message depends on the provider
	// 	if (e instanceof OAuth2RequestError) {
	// 		// invalid code
	// 		return new Response(null, {
	// 			status: 400,
	// 		});
	// 	}
	// 	return new Response(null, {
	// 		status: 500,
	// 	});
	// }
}

interface GitHubUser {
	id: number;
	login: string;
}
