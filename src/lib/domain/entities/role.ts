export enum Role {
  ArticleAuthor = 'article_author',
}

export enum Permission {
  CreateArticle = 'create_article',
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ArticleAuthor]: [Permission.CreateArticle],
};

export function hasPermission(roles: Role[], permission: Permission) {
  return roles.some((role) => rolePermissions[role].includes(permission));
}

export interface Relation {
  username: string;
  name: string;
  invitedAt: Date;
}

export interface UserRelations {
  inviter: Relation | undefined;
  invitees: Relation[];
}
