import type { User, UserPatch, UserRepository } from '$lib/domain/entities/user';
import { eq, or } from 'drizzle-orm';
import { tUser, type AppDatabase } from './schema';
import { newNanoId, wrap } from './utils';

export class D1UserRepository implements UserRepository {
  constructor(private db: AppDatabase) {}

  async getUserByKey(key: string): Promise<User | null> {
    return await wrap('user.findByUsernameOrId', async () => {
      const id = key.length === 16 ? key.slice(0, 6) : key;
      const users = await this.db
        .select()
        .from(tUser)
        .where(or(eq(tUser.username, key), eq(tUser.id, id)));
      return users.length !== 0 ? users[0] : null;
    });
  }

  async findByGitHubId(githubId: number): Promise<User | null> {
    return await wrap('user.findByGitHubId', async () => {
      const users = await this.db.select().from(tUser).where(eq(tUser.githubId, githubId));
      return users.length !== 0 ? users[0] : null;
    });
  }

  async generateId(): Promise<string> {
    return await wrap('user.generateId', async () => {
      let id = newNanoId();
      const count = () => this.db.$count(tUser, eq(tUser.id, id));
      while ((await count()) > 0) {
        id = newNanoId();
      }
      return id;
    });
  }

  async create(user: User): Promise<void> {
    await wrap('user.create', () => this.db.insert(tUser).values(user));
  }

  async update(userId: string, patch: Partial<UserPatch>): Promise<void> {
    await wrap('user.update', () => this.db.update(tUser).set(patch).where(eq(tUser.id, userId)));
  }
}
