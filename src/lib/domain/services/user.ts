import type { User, UserRepository } from '$lib/domain/entities/user';

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

  async findUserById(id: string): Promise<User | null> {
    return await this.user.findById(id);
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return await this.user.findByUsername(username);
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
