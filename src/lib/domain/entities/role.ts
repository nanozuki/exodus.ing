export enum Role {
  ArticleAuthor = 'article_author',
}

export enum Permission {
  CreateArticle = 'create_article',
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ArticleAuthor]: [Permission.CreateArticle],
};

export interface RoleRepository {
  specifyRoleByOther(userId: string, role: Role, otherId: string): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;
}
