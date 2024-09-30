import type { User, UserPatch, UserRepository } from '$lib/domain/user';
import { AppError } from '$lib/errors';
import { eq } from 'drizzle-orm';
import { tUser, type AppD1Database } from './schema';
import { newNanoId, wrap } from './utils';

export class D1UserRepository implements UserRepository {
  constructor(private db: AppD1Database) {}

  async getById(userId: string): Promise<User> {
    const users = await wrap(
      async () => await this.db.select().from(tUser).where(eq(tUser.id, userId)),
    );
    if (users.length === 0) {
      return AppError.UserNotFound(userId).throw();
    }
    return users[0];
  }

  async findByGitHubId(githubId: number): Promise<User | null> {
    const users = await wrap(
      async () => await this.db.select().from(tUser).where(eq(tUser.githubId, githubId)),
    );
    return users.length !== 0 ? users[0] : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const users = await wrap(async () =>
      this.db.select().from(tUser).where(eq(tUser.username, username)),
    );
    return users.length !== 0 ? users[0] : null;
  }

  async generateId(): Promise<string> {
    let id = newNanoId();
    const count = async () =>
      await wrap(async () => (await this.db.select().from(tUser).where(eq(tUser.id, id))).length);
    while ((await count()) > 0) {
      // try again if the id is already in use
      id = newNanoId();
    }
    return id;
  }

  async create(user: User): Promise<void> {
    await wrap(async () => await this.db.insert(tUser).values(user));
  }

  async update(userId: string, patch: Partial<UserPatch>): Promise<void> {
    await wrap(async () => await this.db.update(tUser).set(patch).where(eq(tUser.id, userId)));
  }
}
