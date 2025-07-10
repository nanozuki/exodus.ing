import type { RepositorySet } from '$lib/domain/services';
import { schema, type AppDatabase } from '$lib/server/repositories/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { SqliteArticleRepository } from './article';
import { SqliteBookmarkRepository } from './bookmark';
import { SqliteCommentRepository } from './comment';
import { SqliteInviteCodeRepository } from './invite_code';
import { SqliteUserRepository } from './user';
import { SqliteUserDomainRepository } from './user_domain';
import { SqliteRoleRepository } from './role';
import type { Config } from '$lib/server/config';

export async function getDatabase(config: Config): Promise<AppDatabase> {
  const start = Date.now();
  const db = drizzle(config.EXODUSING_DATABASE, { schema, logger: true });
  const duration = Date.now() - start;
  console.log(`[CONNECT-DATABASE] connected sqlite in ${duration}ms`);
  return db;
}

export async function createRepositorySet(db: AppDatabase): Promise<RepositorySet> {
  return {
    article: new SqliteArticleRepository(db),
    bookmark: new SqliteBookmarkRepository(db),
    comment: new SqliteCommentRepository(db),
    inviteCode: new SqliteInviteCodeRepository(db),
    role: new SqliteRoleRepository(db),
    user: new SqliteUserRepository(db),
    userDomain: new SqliteUserDomainRepository(db),
  };
}
