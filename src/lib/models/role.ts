import type { UserSummary } from './user';

export enum Role {
  ArticleAuthor = 'article_author',
}

export enum Permission {
  CreateArticle = 'create_article',
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ArticleAuthor]: [Permission.CreateArticle],
};

/**
 * Reports whether any of `roles` grants `permission`. Every role must be a key of `rolePermissions`; an unknown runtime
 * value throws.
 */
export function hasPermission(roles: Role[], permission: Permission): boolean {
  return roles.some((role) => rolePermissions[role].includes(permission));
}

export interface Relation {
  user: UserSummary;
  invitedAt: Date;
}

export interface UserRelations {
  inviter: Relation | undefined;
  invitees: Relation[];
}

/**
 * One assignment of a role to a user, identified by `(userId, roleKey)`. A null `inviterId` marks a direct assignment
 * without an inviter.
 */
export interface UserRole {
  userId: string;
  roleKey: Role;
  inviterId: string | null;
  invitedAt: Date;
}
