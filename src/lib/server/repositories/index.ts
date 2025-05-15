import type { RepositorySet } from '$lib/domain/services';
import { once } from '$lib/once';
import { D1ArticleRepository } from './article';
import { D1BookmarkRepository } from './bookmark';
import { D1CommentRepository } from './comment';
import { D1InviteCodeRepository } from './invite_code';
import type { AppDatabase } from './schema';
import { D1UserRepository } from './user';
import { D1UserDomainRepository } from './user_domain';

export function createRepositorySet(db: AppDatabase): RepositorySet {
  return {
    article: once(() => new D1ArticleRepository(db)),
    bookmark: once(() => new D1BookmarkRepository(db)),
    comment: once(() => new D1CommentRepository(db)),
    inviteCode: once(() => new D1InviteCodeRepository(db)),
    user: once(() => new D1UserRepository(db)),
    userDomain: once(() => new D1UserDomainRepository(db)),
  };
}
