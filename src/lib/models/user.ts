import { hasPermission, type Role, type Permission } from './role';

export interface User extends UserSummary {
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

// The single source of supported sign-in providers; the database enum is declared from it.
export const identityProviders = ['github'] as const;

export type IdentityProvider = (typeof identityProviders)[number];

// subject is the provider's stable, never-reassigned account identifier, matching the OIDC sub claim;
// (provider, subject) identifies at most one user. A GitHub subject is the decimal string of its numeric account ID.
export interface UserIdentity {
  userId: string;
  provider: IdentityProvider;
  subject: string;
}
