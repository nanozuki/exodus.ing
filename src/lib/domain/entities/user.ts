export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  githubId: number | null;
  name: string;
  aboutMe: string;
}

export interface UserPatch {
  username: string;
  name: string;
  aboutMe: string;
}

export interface UserRepository {
  findByGitHubId(githubId: number): Promise<User | null>;
  getUserByKey(key: string): Promise<User | null>;

  generateId(): Promise<string>;
  create(user: User): Promise<void>;
  update(userId: string, patch: Partial<UserPatch>): Promise<void>;
}
