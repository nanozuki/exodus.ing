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
  findById(username: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  findByGitHubId(githubId: number): Promise<User | null>;

  create(user: UserInput): Promise<User>;
  update(userId: string, patch: Partial<UserPatch>): Promise<void>;
}
