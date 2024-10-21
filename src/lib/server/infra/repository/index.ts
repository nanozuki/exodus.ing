import type { Repositories } from '$lib/domain/services';
import { createLazyProxy } from '$lib/lazy';
import { D1ArticleRepository } from './article';
import { D1BookmarkRepository } from './bookmark';
import { D1CommentRepository } from './comment';
import { D1InviteCodeRepository } from './invite_code';
import type { AppD1Database } from './schema';
import { D1UserRepository } from './user';
import { D1UserDomainRepository } from './user_domain';

export function buildRepositories(db: AppD1Database) {
  return createLazyProxy<Repositories>({
    article: () => new D1ArticleRepository(db),
    bookmark: () => new D1BookmarkRepository(db),
    comment: () => new D1CommentRepository(db),
    inviteCode: () => new D1InviteCodeRepository(db),
    user: () => new D1UserRepository(db),
    userDomain: () => new D1UserDomainRepository(db),
  });
}
