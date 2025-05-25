import type { User, UserInput, UserPatch, UserRepository } from '$lib/domain/entities/user';
import { eq, or } from 'drizzle-orm';
import { tUser, type AppDatabase } from './schema';
import { newNanoId, wrap } from './utils';

export class SqliteUserRepository implements UserRepository {
  constructor(private db: AppDatabase) {}

  async findByKey(key: string): Promise<User | null> {
    return await wrap('user.getUserByKey', async () => {
      const id = key.length === 16 ? key.slice(0, 6) : key;
      const users = await this.db
        .select({
          id: tUser.id,
          username: tUser.username,
          githubId: tUser.githubId,
          name: tUser.name,
          aboutMe: tUser.aboutMe,
        })
        .from(tUser)
        .where(or(eq(tUser.username, key), eq(tUser.id, id)));
      return users.length !== 0 ? users[0] : null;
    });
  }

  async findByName(name: string): Promise<User | null> {
    return await wrap('user.findUserByName', async () => {
      const users = await this.db
        .select({
          id: tUser.id,
          username: tUser.username,
          githubId: tUser.githubId,
          name: tUser.name,
          aboutMe: tUser.aboutMe,
        })
        .from(tUser)
        .where(eq(tUser.name, name));
      return users.length !== 0 ? users[0] : null;
    });
  }

  async findByGitHubId(githubId: number): Promise<User | null> {
    return await wrap('user.findByGitHubId', async () => {
      const users = await this.db
        .select({
          id: tUser.id,
          username: tUser.username,
          githubId: tUser.githubId,
          name: tUser.name,
          aboutMe: tUser.aboutMe,
        })
        .from(tUser)
        .where(eq(tUser.githubId, githubId));
      return users.length !== 0 ? users[0] : null;
    });
  }

  private async generateId(): Promise<string> {
    return await wrap('user.generateId', async () => {
      let id = newNanoId();
      const count = () => this.db.$count(tUser, eq(tUser.id, id));
      while ((await count()) > 0) {
        id = newNanoId();
      }
      return id;
    });
  }

  async create(input: UserInput): Promise<User> {
    const id = await this.generateId();
    const now = new Date();
    const user = {
      id,
      createdAt: now,
      updatedAt: now,
      username: input.username,
      githubId: input.githubId,
      name: input.name,
      aboutMe: input.aboutMe,
    };
    return await wrap('user.create', async () => {
      await this.db.insert(tUser).values(user);
      return { ...user, roles: [] };
    });
  }

  async update(userId: string, patch: Partial<UserPatch>): Promise<void> {
    await wrap('user.update', () => this.db.update(tUser).set(patch).where(eq(tUser.id, userId)));
  }
}
