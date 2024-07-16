import { dev } from '$app/environment';
import { EXODUSING_GITHUB_ID, EXODUSING_GITHUB_SECRET } from '$env/static/private';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import type { RequestEvent } from '@sveltejs/kit';
import { GitHub } from 'arctic';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { Lucia } from 'lucia';
import * as schema from '../schema';

export async function getPlatform(event: RequestEvent): Promise<App.Platform> {
	if (dev) {
		const { getPlatformProxy } = await import('wrangler');
		const platform: unknown = await getPlatformProxy();
		return platform as App.Platform;
	}
	if (!event.platform) {
		throw new Error('Platform not found');
	}
	return event.platform;
}

export function getDatabase(platform: App.Platform): DrizzleD1Database<typeof schema> {
	const db = drizzle(platform.env.EXODUSING_DB, { schema, logger: true });
	return db;
}

export function getLucia(db: DrizzleD1Database<typeof schema>) {
	const authAdapter = new DrizzleSQLiteAdapter(db, schema.session, schema.user);
	const lucia = new Lucia(authAdapter, {
		sessionCookie: {
			attributes: {
				secure: !dev, // whether to use HTTPS
			},
		},
		getUserAttributes: (attributes) => {
			return {
				githubId: attributes.github_id,
				username: attributes.username,
			};
		},
	});
	return lucia;
}

export function getGitHubProvider() {
	const github = new GitHub(EXODUSING_GITHUB_ID, EXODUSING_GITHUB_SECRET);
	return github;
}

declare module 'lucia' {
	interface Register {
		Lucia: ReturnType<typeof getLucia>;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	github_id: number;
	username: string;
}
