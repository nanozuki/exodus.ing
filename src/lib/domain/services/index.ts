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

export interface Services {
  article: ArticleService;
  articleList: ArticleListService;
  auth: AuthService;
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
  return createLazyProxy<Services>({
    article: () => new ArticleService(repositories.article),
    articleList: () => new ArticleListService(repositories.article),
    auth: () => new AuthService(adapters.auth, repositories.inviteCode, repositories.user),
    user: () => new UserService(repositories.user),
    userDomain: () => new UserDomainService(repositories.userDomain, adapters.nameResolver),
  });
}
