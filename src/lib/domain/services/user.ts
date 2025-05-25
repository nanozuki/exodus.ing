import type { User, UserRepository } from '$lib/domain/entities/user';
import { AppError } from '$lib/errors';

export interface GitHubUser {
  id: number;
  username: string;
}

export interface CreateUserOptions {
  username?: string;
  name?: string;
}

export class UserService {
  constructor(private user: UserRepository) {}

  async getUserByKey(key: string): Promise<User> {
    const user = await this.user.findByKey(key);
    if (!user) {
      return AppError.UserNotFound(key).throw();
    }
    return user;
  }

  async findUserByGitHubId(id: number): Promise<User | null> {
    return await this.user.findByGitHubId(id);
  }

  async updateUsername(userId: string, username: string): Promise<void> {
    await this.user.update(userId, { username });
  }

  async updateProfile(userId: string, name: string, aboutMe: string): Promise<void> {
    await this.user.update(userId, { name, aboutMe });
  }
}
