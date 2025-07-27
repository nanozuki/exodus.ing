import { schema, type AppDatabase } from '$lib/server/repositories/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PgArticleRepository } from './article';
import { PgBookmarkRepository } from './bookmark';
import { PgCommentRepository } from './comment';
import { PgInviteCodeRepository } from './invite_code';
import { PgUserRepository } from './user';
import { PgRoleRepository } from './role';
import type { Config } from '$lib/server/config';

export async function getDatabase(config: Config): Promise<AppDatabase> {
  const start = Date.now();
  const db = drizzle(config.EXODUSING_DATABASE, { schema, logger: true });
  const duration = Date.now() - start;
  console.log(`[CONNECT-DATABASE] connected database in ${duration}ms`);
  return db;
}

export function createRepositorySet(db: AppDatabase) {
  return {
    article: new PgArticleRepository(db),
    bookmark: new PgBookmarkRepository(db),
    comment: new PgCommentRepository(db),
    inviteCode: new PgInviteCodeRepository(db),
    role: new PgRoleRepository(db),
    user: new PgUserRepository(db),
  };
}

export type RepositorySet = ReturnType<typeof createRepositorySet>;
