import { index, integer, pgTable, text, uniqueIndex, primaryKey, timestamp, serial, jsonb } from 'drizzle-orm/pg-core';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ArticleContentType } from '$lib/domain/entities/article';

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};

export const tUser = pgTable('user', {
  id: text('id').notNull().primaryKey(),
  ...timestamps,
  username: text('username').notNull().unique(),
  githubId: integer('github_id').unique(),
  name: text('name').notNull().unique(),
  aboutMe: text('about_me').notNull(),
  verifyCode: text('verify_code').notNull(),
});

export const tSession = pgTable(
  'session',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [index('session_user_id_idx').on(table.userId), index('expires_at_idx').on(table.expiresAt)],
);

export const tUserAuth = pgTable(
  'user_auth',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    providerUsername: text('provider_username'),
    providerEmail: text('provider_email'),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    uniqueIndex('user_auth_provider_user_id_idx').on(table.provider, table.providerUserId),
    index('user_auth_user_id_idx').on(table.userId),
  ],
);

export const tPendingAuth = pgTable(
  'pending_auth',
  {
    id: text('id').notNull().primaryKey(),
    authType: text('auth_type').notNull(),
    state: text('state'),
    provider: text('provider'),
    providerUserId: text('provider_user_id'),
    providerUsername: text('provider_username'),
    providerEmail: text('provider_email'),
    payload: jsonb('payload'),
    next: text('next'),
    signUpUsername: text('sign_up_username'),
    signUpName: text('sign_up_name'),
    createdAt: timestamps.createdAt,
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    uniqueIndex('pending_auth_state_idx').on(table.state),
    index('pending_auth_expires_at_idx').on(table.expiresAt),
  ],
);

export const tInviteCode = pgTable(
  'invite_code',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull().unique(),
    roleKey: text('role_key').notNull(),
    inviterId: text('inviter_id').notNull(),
    usedAt: timestamp('used_at'),
  },
  (table) => [index('invite_code_inviter_id_idx').on(table.inviterId)],
);

export const tArticle = pgTable(
  'article',
  {
    id: text('id').notNull().primaryKey(),
    ...timestamps,
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    contentType: text('content_type').$type<ArticleContentType>().notNull(),
    path: text('path').notNull(),
    replyCount: integer('reply_count').default(0).notNull(),
    bookmarkCount: integer('bookmark_count').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('article_title_idx').on(table.title, table.userId),
    index('article_user_id_idx').on(table.userId),
    index('article_path_idx').on(table.path),
  ],
);

export const tComment = pgTable(
  'comment',
  {
    id: text('id').notNull().primaryKey(),
    path: text('path').notNull(),
    ...timestamps,
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

export const tBookmark = pgTable(
  'bookmark',
  {
    userId: text('user_id').notNull(),
    articleId: text('article_id').notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index('bookmark_user_id_idx').on(table.userId), index('bookmark_article_id_idx').on(table.articleId)],
);

export const tUserRole = pgTable(
  'user_role',
  {
    userId: text('user_id').notNull(),
    roleKey: text('role_key').notNull(),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    inviterId: text('inviter_id'),
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
  tPendingAuth,
  tSession,
  tUser,
  tUserAuth,
  tUserRole,
};

export type ArticleModel = typeof tArticle.$inferSelect;
export type BookmarkModel = typeof tBookmark.$inferSelect;
export type CommentModel = typeof tComment.$inferSelect;
export type InviteCodeModel = typeof tInviteCode.$inferSelect;
export type PendingAuthModel = typeof tPendingAuth.$inferSelect;
export type SessionModel = typeof tSession.$inferSelect;
export type UserAuthModel = typeof tUserAuth.$inferSelect;
export type UserModel = typeof tUser.$inferSelect;
export type UserRoleModel = typeof tUserRole.$inferSelect;

export type AppDatabase = NodePgDatabase<typeof schema>;
