import type { ArticleRepository } from '$lib/domain/entities/article';
import type { BookmarkRepository } from '$lib/domain/entities/bookmark';
import type { CommentRepository } from '$lib/domain/entities/comment';
import type { InviteCodeRepository } from '$lib/domain/entities/invite_code';
import type { UserRepository } from '$lib/domain/entities/user';
import type { UserDomainRepository } from '$lib/domain/entities/user_domain';
import { once, type Once } from '$lib/once';
import { ArticleService } from './article';
import { ArticleListService } from './article_list';
import { AuthService, type AuthAdapter } from './auth';
import { BookmarkService } from './bookmark';
import { CommentService } from './comment';
import { FeedsService } from './feeds';
import { InviteCodeService } from './invite_code';
import { UserService } from './user';
import { UserDomainService, type NameResolver } from './user_domain';

export type ServiceSet = {
  article: Once<ArticleService>;
  articleList: Once<ArticleListService>;
  auth: Once<AuthService>;
  bookmark: Once<BookmarkService>;
  comment: Once<CommentService>;
  feeds: Once<FeedsService>;
  inviteCode: Once<InviteCodeService>;
  user: Once<UserService>;
  userDomain: Once<UserDomainService>;
};

export interface AdapterSet {
  auth: Once<AuthAdapter>;
  nameResolver: Once<NameResolver>;
}

export interface RepositorySet {
  article: Once<ArticleRepository>;
  bookmark: Once<BookmarkRepository>;
  comment: Once<CommentRepository>;
  inviteCode: Once<InviteCodeRepository>;
  user: Once<UserRepository>;
  userDomain: Once<UserDomainRepository>;
}

export function buildServices(repositories: RepositorySet, adapters: AdapterSet): ServiceSet {
  const user = once(() => new UserService(repositories.user()));
  const inviteCode = once(() => new InviteCodeService(repositories.inviteCode()));
  const auth = once(() => new AuthService(adapters.auth(), user(), inviteCode()));
  return {
    article: once(() => new ArticleService(repositories.article(), auth())),
    articleList: once(() => new ArticleListService(repositories.article())),
    auth,
    bookmark: once(() => new BookmarkService(repositories.bookmark())),
    comment: once(() => new CommentService(repositories.comment())),
    feeds: once(() => new FeedsService(repositories.article())),
    inviteCode,
    user,
    userDomain: once(() => new UserDomainService(repositories.userDomain(), adapters.nameResolver())),
  };
}
