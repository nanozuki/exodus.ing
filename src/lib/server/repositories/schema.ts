import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { index, integer, sqliteTable, text, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';

export const tUser = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  username: text('username').notNull().unique(),
  githubId: integer('github_id').unique(),
  name: text('name').notNull().unique(),
  aboutMe: text('about_me').notNull(),
});

export const tSession = sqliteTable(
  'session',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('session_user_id_idx').on(table.userId), index('expires_at_idx').on(table.expiresAt)],
);

export const tInviteCode = sqliteTable(
  'invite_code',
  {
    id: integer('id').primaryKey(),
    code: text('code').notNull().unique(),
    roleKey: text('role_key').notNull(),
    inviterId: text('inviter_id').notNull(),
    usedAt: integer('used_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('invite_code_inviter_id_idx').on(table.inviterId)],
);

export type ArticleContentType = 'markdown' | 'external_link';

export const tArticle = sqliteTable(
  'article',
  {
    id: text('id').notNull().primaryKey(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    contentType: text('content_type').$type<ArticleContentType>().notNull(),
    path: text('path').notNull(),
  },
  (table) => [
    uniqueIndex('article_title_idx').on(table.title, table.userId),
    index('article_user_id_idx').on(table.userId),
    index('article_path_idx').on(table.path),
  ],
);

export const tUserDomain = sqliteTable(
  'user_domain',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    domain: text('domain').notNull().unique(),
    verifyTxtRecord: text('verify_txt_record').notNull(),
    verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('user_domain_user_id_idx').on(table.userId)],
);

export const tComment = sqliteTable(
  'comment',
  {
    id: text('id').notNull().primaryKey(),
    path: text('path').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    userId: text('user_id').notNull(),
    articleId: text('article_id').notNull(),
    content: text('content').notNull(),
  },
  (table) => [
    index('comment_article_id_idx').on(table.articleId),
    index('comment_user_id_idx').on(table.userId),
    index('comment_path_idx').on(table.path),
  ],
);

export const tBookmark = sqliteTable(
  'bookmark',
  {
    userId: text('user_id').notNull(),
    articleId: text('article_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('bookmark_user_id_idx').on(table.userId), index('bookmark_article_id_idx').on(table.articleId)],
);

export const tUserRole = sqliteTable(
  'user_role',
  {
    userId: text('user_id').notNull(),
    roleKey: text('role_key').notNull(),
    inviterId: text('inviter_id').notNull(),
    invitedAt: integer('invited_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleKey] }),
    index('user_role_inviter_id_idx').on(table.inviterId),
  ],
);

export const schema = {
  tArticle,
  tBookmark,
  tComment,
  tInviteCode,
  tSession,
  tUser,
  tUserDomain,
};

export type ArticleModel = typeof tArticle.$inferSelect;
export type BookmarkModel = typeof tBookmark.$inferSelect;
export type CommentModel = typeof tComment.$inferSelect;
export type InviteCodeModel = typeof tInviteCode.$inferSelect;
export type SessionModel = typeof tSession.$inferSelect;
export type UserDomainModel = typeof tUserDomain.$inferSelect;
export type UserModel = typeof tUser.$inferSelect;
export type UserRoleModel = typeof tUserRole.$inferSelect;

export type AppDatabase = LibSQLDatabase<typeof schema>;
