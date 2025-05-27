import type { ArticleRepository } from '$lib/domain/entities/article';
import type { BookmarkRepository } from '$lib/domain/entities/bookmark';
import type { CommentRepository } from '$lib/domain/entities/comment';
import type { InviteCodeRepository } from '$lib/domain/entities/invite_code';
import type { UserRepository } from '$lib/domain/entities/user';
import type { UserDomainRepository } from '$lib/domain/entities/user_domain';
import type { RoleRepository } from '../entities/role';
import { ArticleService } from './article';
import { ArticleListService } from './article_list';
import { AuthService, type AuthAdapter } from './auth';
import { BookmarkService } from './bookmark';
import { CommentService } from './comment';
import { FeedsService } from './feeds';
import { InviteCodeService } from './invite_code';
import { RoleService } from './role';
import { UserService } from './user';
import { UserDomainService, type NameResolver } from './user_domain';

export type ServiceSet = {
  article: ArticleService;
  articleList: ArticleListService;
  auth: AuthService;
  bookmark: BookmarkService;
  comment: CommentService;
  feeds: FeedsService;
  inviteCode: InviteCodeService;
  role: RoleService;
  user: UserService;
  userDomain: UserDomainService;
};

export interface AdapterSet {
  auth: AuthAdapter;
  nameResolver: NameResolver;
}

export interface RepositorySet {
  article: ArticleRepository;
  bookmark: BookmarkRepository;
  comment: CommentRepository;
  inviteCode: InviteCodeRepository;
  role: RoleRepository;
  user: UserRepository;
  userDomain: UserDomainRepository;
}

export function createServiceSet(repositories: RepositorySet, adapters: AdapterSet): ServiceSet {
  return {
    article: new ArticleService(repositories.article),
    articleList: new ArticleListService(repositories.article),
    auth: new AuthService(adapters.auth, repositories.user),
    bookmark: new BookmarkService(repositories.bookmark),
    comment: new CommentService(repositories.comment),
    feeds: new FeedsService(repositories.article),
    inviteCode: new InviteCodeService(repositories.inviteCode, repositories.role),
    role: new RoleService(repositories.role),
    user: new UserService(repositories.user),
    userDomain: new UserDomainService(repositories.userDomain, adapters.nameResolver),
  };
}
