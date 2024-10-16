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
  getById(userId: string): Promise<User>;
  findByGitHubId(githubId: number): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;

  generateId(): Promise<string>;
  create(user: User): Promise<void>;
  update(userId: string, patch: Partial<UserPatch>): Promise<void>;
}
