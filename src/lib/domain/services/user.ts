import type { User, UserRepository } from '$lib/domain/entities/user';

export interface GitHubUser {
  id: number;
  username: string;
}

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

  async createUserByGitHub(gitHubUser: GitHubUser): Promise<User> {
    const userId = await this.user.generateId();
    const now = new Date();
    const user = {
      id: userId,
      createdAt: now,
      updatedAt: now,
      username: gitHubUser.username,
      githubId: gitHubUser.id,
      name: gitHubUser.username,
      aboutMe: '',
    };
    await this.user.create(user);
    return user;
  }

  async updateUsername(userId: string, username: string): Promise<void> {
    await this.user.update(userId, { username });
  }

  async updateProfile(userId: string, name: string, aboutMe: string): Promise<void> {
    await this.user.update(userId, { name, aboutMe });
  }
}
