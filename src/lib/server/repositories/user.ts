import type { User, UserInput, UserPatch, UserRepository } from '$lib/domain/entities/user';
import { eq } from 'drizzle-orm';
import { tUser, type AppDatabase } from './schema';
import { newNanoId, newVerifyCode, wrap } from './utils';

export class PgUserRepository implements UserRepository {
  constructor(private db: AppDatabase) {}

  async findById(id: string): Promise<User | null> {
    const compabilityId = id.length === 16 ? id.slice(0, 6) : id;
    const users = await this.db
      .select({
        id: tUser.id,
        username: tUser.username,
        githubId: tUser.githubId,
        name: tUser.name,
        aboutMe: tUser.aboutMe,
      })
      .from(tUser)
      .where(eq(tUser.id, compabilityId));
    return users.length !== 0 ? users[0] : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return await wrap('user.getUserByKey', async () => {
      const users = await this.db
        .select({
          id: tUser.id,
          username: tUser.username,
          githubId: tUser.githubId,
          name: tUser.name,
          aboutMe: tUser.aboutMe,
        })
        .from(tUser)
        .where(eq(tUser.username, username));
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
      console.log('findByGitHubId', githubId, users);
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
      verifyCode: newVerifyCode(),
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
