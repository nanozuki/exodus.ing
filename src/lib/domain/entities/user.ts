export interface User {
  id: string;
  username: string;
  githubId: number | null;
  name: string;
  aboutMe: string;
}

export interface UserCard {
  username: string;
  name: string;
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
