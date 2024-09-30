import type { Context } from '$lib/server/context';
import type { RequestEvent } from '@sveltejs/kit';
import { clock } from './adapter/clock';
import { LuciaAuthService } from './adapter/lucia';
import { nameResolver } from './adapter/name_resolver';
import { getD1Database } from './data_source';
import { D1ArticleRepository } from './repository/article';
import { D1InviteCodeRepository } from './repository/invite_code';
import { D1UserRepository } from './repository/user';
import { D1UserDomainRepository } from './repository/user_domain';
import { ArticleUseCase } from './use_case/article';
import { AuthUseCase } from './use_case/auth';
import { UserUseCase } from './use_case/user';
import { UserDomainUseCase } from './use_case/user_domain';

export async function buildAppLocals(event: RequestEvent): Promise<App.Locals> {
  const db = await getD1Database(event);
  const auth = await LuciaAuthService.Load(event, db);
  const ctx: Context = {
    article: new D1ArticleRepository(db),
    user: new D1UserRepository(db),
    userDomain: new D1UserDomainRepository(db),
    inviteCode: new D1InviteCodeRepository(db),
    clock,
    auth,
    nameResolver,
  };
  return {
    article: new ArticleUseCase(ctx),
    auth: new AuthUseCase(ctx),
    user: new UserUseCase(ctx),
    userDomain: new UserDomainUseCase(ctx),
  };
}
