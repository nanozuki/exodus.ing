import { Permission, rolePermissions, type Role } from './role';

export interface User {
  id: string;
  username: string;
  githubId: number | null;
  name: string;
  aboutMe: string;
  verifyCode: string;
}

export interface LoggedInUser extends User {
  roles: Role[];
}

export function userHasPermission(user: LoggedInUser | null, permission: Permission): boolean {
  return user ? user.roles.some((role) => rolePermissions[role].includes(permission)) : false;
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
