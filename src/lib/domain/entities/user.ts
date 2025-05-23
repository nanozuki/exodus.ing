export interface User {
  id: string;
  username: string;
  githubId: number | null;
  name: string;
  aboutMe: string;
}

export interface UserInput {
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

  create(user: UserInput): Promise<User>;
  update(userId: string, patch: Partial<UserPatch>): Promise<void>;
}
