import { ArticleService } from './article';
import { ArticleListService } from './article_list';
import { AuthService } from './auth';
import { UserService } from './user';
import { UserDomainService } from './user_domain';
import type { AuthPort, NameResolver } from '$lib/domain/ports';
import type { ArticleRepository } from '$lib/domain/entities/article';
import type { BookmarkRepository } from '$lib/domain/entities/bookmark';
import type { CommentRepository } from '$lib/domain/entities/comment';
import type { InviteCodeRepository } from '$lib/domain/entities/invite_code';
import type { UserRepository } from '$lib/domain/entities/user';
import type { UserDomainRepository } from '$lib/domain/entities/user_domain';
import { createLazyProxy } from '$lib/lazy';
import { CommentService } from './comment';
import { BookmarkService } from './bookmark';
import { InviteCodeService } from './invite_code';
import { NameResolverService } from './name_resolver';

export interface Services {
  article: ArticleService;
  articleList: ArticleListService;
  auth: AuthService;
  bookmark: BookmarkService;
  comment: CommentService;
  inviteCode: InviteCodeService;
  user: UserService;
  userDomain: UserDomainService;
  nameResolver: NameResolverService;
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
  return createLazyProxy<Services>({
    article: () => new ArticleService(repositories.article),
    articleList: () => new ArticleListService(repositories.article),
    auth: () => new AuthService(adapters.auth),
    bookmark: () => new BookmarkService(repositories.bookmark),
    comment: () => new CommentService(repositories.comment),
    inviteCode: () => new InviteCodeService(repositories.inviteCode),
    user: () => new UserService(repositories.user),
    userDomain: () => new UserDomainService(repositories.userDomain),
    nameResolver: () => new NameResolverService(adapters.nameResolver),
  });
}
