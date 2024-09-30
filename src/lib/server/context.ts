import type { AuthService, Clock, NameResolver } from '$lib/domain/adapters';
import type { ArticleRepository } from '$lib/domain/article';
import type { InviteCodeRepository } from '$lib/domain/invite_code';
import type { UserRepository } from '$lib/domain/user';
import type { UserDomainRepository } from '$lib/domain/user_domain';

export interface Context {
  article: ArticleRepository;
  user: UserRepository;
  userDomain: UserDomainRepository;
  inviteCode: InviteCodeRepository;

  clock: Clock;
  auth: AuthService;
  nameResolver: NameResolver;
}
