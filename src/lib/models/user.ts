import { hasPermission, type Role, type Permission } from './role';

export interface User extends UserSummary {
  githubId: number | null;
  aboutMe: string;
  verifyCode: string;
}

export interface LoggedInUser extends User {
  roles: Role[];
}

export function userHasPermission(user: LoggedInUser | null, permission: Permission): boolean {
  return user ? hasPermission(user.roles, permission) : false;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
}
