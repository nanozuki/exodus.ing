import { env } from '$env/dynamic/private';
import type { RepositorySet } from '$lib/domain/services';
import { schema, type AppDatabase } from '$lib/server/repositories/schema';
import { createClient } from '@libsql/client/sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import { D1ArticleRepository } from './article';
import { D1BookmarkRepository } from './bookmark';
import { D1CommentRepository } from './comment';
import { D1InviteCodeRepository } from './invite_code';
import { D1UserRepository } from './user';
import { D1UserDomainRepository } from './user_domain';

export async function getDatabase(): Promise<AppDatabase> {
  if (!env.EXODUSING_DATABASE) {
    throw new Error('DATABASE_URL is not set');
  }
  const start = Date.now();
  const client = createClient({ url: env.EXODUSING_DATABASE });
  const db = drizzle(client, { schema, logger: true });
  const duration = Date.now() - start;
  console.log(`[CONNECT-DATABASE] connected D1 database in ${duration}ms`);
  return db;
}

export async function createRepositorySet(db: AppDatabase): Promise<RepositorySet> {
  return {
    article: new D1ArticleRepository(db),
    bookmark: new D1BookmarkRepository(db),
    comment: new D1CommentRepository(db),
    inviteCode: new D1InviteCodeRepository(db),
    user: new D1UserRepository(db),
    userDomain: new D1UserDomainRepository(db),
  };
}
