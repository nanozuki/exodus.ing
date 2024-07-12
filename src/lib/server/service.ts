import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../schema';

export class Service {
	db: DrizzleD1Database<typeof schema>;

	constructor(platform: App.Platform) {
		this.db = drizzle(platform.env.EXODUSING_DB, { schema });
	}

	async createUser(username: string, password: string, name: string, inviteCode: string) {
		const ic = await this.db.query.inviteCode.findFirst({
			with: { code: inviteCode },
		});
		const now = new Date();
		if (!ic || ic.validFrom.getTime() > now.getTime() || ic.validTo.getTime() < now.getTime()) {
			throw new Error('Invalid invite code');
		}
		await this.db.insert(schema.user).values({
			id: new Uint8Array(16) as Buffer,
			username,
			passwordHash: password,
			name,
			createdAt: now,
			updatedAt: now,
		});
	}
}
