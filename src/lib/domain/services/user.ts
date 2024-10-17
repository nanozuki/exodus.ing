import type { User, UserRepository } from '$lib/domain/entities/user';

export class UserService {
  constructor(private user: UserRepository) {}

  async getUserById(userId: string): Promise<User> {
    // if userId's length is 16, it's legacy userId, shorten it by first 6 characters
    if (userId.length === 16) {
      userId = userId.slice(0, 6);
    }
    return await this.user.getById(userId);
  }

  async findUserByGitHubId(id: number): Promise<User | null> {
    return await this.user.findByGitHubId(id);
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return await this.user.findByUsername(username);
  }

  async updateUsername(userId: string, username: string): Promise<void> {
    await this.user.update(userId, { username });
  }

  async updateProfile(userId: string, name: string, aboutMe: string): Promise<void> {
    await this.user.update(userId, { name, aboutMe });
  }
}
