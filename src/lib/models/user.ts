import { hasPermission, type Role, type Permission } from './role';

export interface User extends UserSummary {
  githubId: number | null;
  aboutMe: string;
  verifyCode: string;
}

/** A sign-in provider, stored with each of a user's identities. */
export type IdentityProvider = 'github';

export interface LoggedInUser extends User {
  roles: Role[];
}

/**
 * Returns false for `null`; otherwise reports whether any of the user's roles grants `permission`. Like
 * `hasPermission`, it throws on an unknown runtime role.
 */
export function userHasPermission(user: LoggedInUser | null, permission: Permission): boolean {
  return user ? hasPermission(user.roles, permission) : false;
}

/**
 * The public identity shown for article and comment authors, navigation, and invitation relationships. `User` adds the
 * GitHub identity, profile text, and verification code.
 */
export interface UserSummary {
  id: string;
  username: string;
  name: string;
}
