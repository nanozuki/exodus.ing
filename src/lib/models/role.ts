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

// A null inviter denotes a direct role assignment.
export interface UserRole {
  userId: string;
  roleKey: Role;
  inviterId: string | null;
  invitedAt: Date;
}
