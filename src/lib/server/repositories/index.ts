import { schema, type AppDatabase } from '$lib/server/repositories/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PgArticleRepository } from './article';
import { PgBookmarkRepository } from './bookmark';
import { PgCommentRepository } from './comment';
import { PgInviteCodeRepository } from './invite_code';
import { PgRoleRepository } from './role';
import { PgSessionRepository } from './session';
import { PgUserRepository } from './user';

export function connectDatabase(pgUrl: string): AppDatabase {
  const start = Date.now();
  const db = drizzle(pgUrl, { schema, logger: true });
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
    session: new PgSessionRepository(db),
  };
}

export type RepositorySet = ReturnType<typeof createRepositorySet>;
