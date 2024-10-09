import type { User } from '$lib/domain/user';
import type { Context } from '$lib/server/context';

export class UserUseCase {
  constructor(private ctx: Context) {}

  async getUserById(userId: string): Promise<User> {
    // if userId's length is 16, it's legacy userId, shorten it by first 6 characters
    if (userId.length === 16) {
      userId = userId.slice(0, 6);
    }
    return await this.ctx.user.getById(userId);
  }

  async findUserByGitHubId(id: number): Promise<User | null> {
    return await this.ctx.user.findByGitHubId(id);
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return await this.ctx.user.findByUsername(username);
  }

  async updateUsername(userId: string, username: string): Promise<void> {
    await this.ctx.user.update(userId, { username });
  }

  async updateProfile(userId: string, name: string, aboutMe: string): Promise<void> {
    await this.ctx.user.update(userId, { name, aboutMe });
  }
}
