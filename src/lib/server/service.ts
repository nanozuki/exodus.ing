import * as schema from '../schema';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { GitHub } from 'arctic';
import { EXODUSING_GITHUB_ID, EXODUSING_GITHUB_SECRET } from '$env/static/private';

// Service is a facade for all backend services
export class Service {
	db: DrizzleD1Database<typeof schema>;
	authAdapter: DrizzleSQLiteAdapter;
	lucia: Lucia;
	github: GitHub;

	constructor(platform: App.Platform) {
		this.db = drizzle(platform.env.EXODUSING_DB, { schema, logger: true });
		this.authAdapter = new DrizzleSQLiteAdapter(this.db, schema.session, schema.user);
		this.lucia = new Lucia(this.authAdapter, {
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
		this.github = new GitHub(EXODUSING_GITHUB_ID, EXODUSING_GITHUB_SECRET);
	}
}
