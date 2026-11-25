import { z } from 'zod';
import { hasPermission, type Role, type Permission } from './role';

export interface User extends UserSummary {
  aboutMe: string;
  verifyCode: string;
}

/** Parses a sign-in provider, the value stored with each of a user's identities. */
export const identityProviderSchema = z.enum(['github']);

export type IdentityProvider = z.infer<typeof identityProviderSchema>;

/**
 * A sign-in method that belongs to one user. `subject` is the provider's user ID as text, unique within its provider;
 * for GitHub it is the numeric account ID in decimal.
 */
export interface UserIdentity {
  provider: IdentityProvider;
  subject: string;
  userId: string;
}

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
 * profile text and verification code; sign-in identities are `UserIdentity` records.
 */
export interface UserSummary {
  id: string;
  username: string;
  name: string;
}
