import type { ArticleRepository } from '$lib/domain/entities/article';
import type { BookmarkRepository } from '$lib/domain/entities/bookmark';
import type { CommentRepository } from '$lib/domain/entities/comment';
import type { InviteCodeRepository } from '$lib/domain/entities/invite_code';
import type { UserRepository } from '$lib/domain/entities/user';
import type { UserDomainRepository } from '$lib/domain/entities/user_domain';
import { createLazyProxy } from '$lib/lazy';
import { ArticleService } from './article';
import { ArticleListService } from './article_list';
import { AuthService, type AuthPort } from './auth';
import { BookmarkService } from './bookmark';
import { CommentService } from './comment';
import { FeedsService } from './feeds';
import { InviteCodeService } from './invite_code';
import { UserService } from './user';
import { UserDomainService, type NameResolver } from './user_domain';

export interface Services {
  article: ArticleService;
  articleList: ArticleListService;
  auth: AuthService;
  bookmark: BookmarkService;
  comment: CommentService;
  feeds: FeedsService;
  inviteCode: InviteCodeService;
  user: UserService;
  userDomain: UserDomainService;
}

export interface Adapters {
  auth: AuthPort;
  nameResolver: NameResolver;
}

export interface Repositories {
  article: ArticleRepository;
  bookmark: BookmarkRepository;
  comment: CommentRepository;
  inviteCode: InviteCodeRepository;
  user: UserRepository;
  userDomain: UserDomainRepository;
}

export function buildServices(repositories: Repositories, adapters: Adapters) {
  const user = new UserService(repositories.user);
  const inviteCode = new InviteCodeService(repositories.inviteCode);
  const auth = new AuthService(adapters.auth, user, inviteCode);
  return createLazyProxy<Services>({
    article: () => new ArticleService(repositories.article, auth),
    articleList: () => new ArticleListService(repositories.article),
    auth: () => auth,
    bookmark: () => new BookmarkService(repositories.bookmark),
    comment: () => new CommentService(repositories.comment),
    feeds: () => new FeedsService(repositories.article),
    inviteCode: () => inviteCode,
    user: () => user,
    userDomain: () => new UserDomainService(repositories.userDomain, adapters.nameResolver),
  });
}
