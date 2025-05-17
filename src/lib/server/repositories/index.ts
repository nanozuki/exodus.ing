import { env } from '$env/dynamic/private';
import type { RepositorySet } from '$lib/domain/services';
import { schema, type AppDatabase } from '$lib/server/repositories/schema';
import { createClient } from '@libsql/client/sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import { SqliteArticleRepository } from './article';
import { SqliteBookmarkRepository } from './bookmark';
import { SqliteCommentRepository } from './comment';
import { SqliteInviteCodeRepository } from './invite_code';
import { SqliteUserRepository } from './user';
import { SqliteUserDomainRepository } from './user_domain';
import { SqliteRoleRepository } from './role';

export async function getDatabase(): Promise<AppDatabase> {
  if (!env.EXODUSING_DATABASE) {
    throw new Error('DATABASE_URL is not set');
  }
  const start = Date.now();
  const client = createClient({ url: env.EXODUSING_DATABASE });
  const db = drizzle(client, { schema, logger: true });
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
