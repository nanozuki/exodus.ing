// schema.ts declares the Drizzle tables and their inferred row types; insert shapes come from each table's
// $inferInsert. `createdAt` and `updatedAt` columns are required and default to now. Tables declare no foreign keys.

import { index, integer, jsonb, pgTable, text, uniqueIndex, primaryKey, timestamp, serial } from 'drizzle-orm/pg-core';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ArticleContentType } from '#lib/models/article.js';
import type { PreAuthPurpose } from '#lib/models/session.js';
import type { IdentityProvider } from '#lib/models/user.js';

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

/** Indexed on `user_id` and on `expires_at`. Expired rows are deleted whenever a session is created. */
export const tSession = pgTable(
  'session',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    secretHash: text('secret_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [index('session_user_id_idx').on(table.userId), index('expires_at_idx').on(table.expiresAt)],
);

/**
 * Short-lived, single-use state for flows that run before an auth session exists, such as sign-up. `id` is a non-secret
 * lookup key and `secret_hash` the hash of the token's secret. The `payload` shape depends on `purpose` and is not
 * validated by the database. Expired rows are deleted whenever a pre-auth session is created. `expires_at` has no
 * index, so that delete scans the table, which stays small because rows expire after a short lifetime.
 */
export const tPreAuthSession = pgTable('pre_auth_session', {
  id: text('id').notNull().primaryKey(),
  secretHash: text('secret_hash').notNull(),
  purpose: text('purpose').$type<PreAuthPurpose>().notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamps.createdAt,
  expiresAt: timestamp('expires_at').notNull(),
});

/**
 * A user's sign-in method. `subject` is the provider's user ID as text. The primary key is (`subject`, `provider`), so
 * an identity belongs to at most one user; `user_id` is indexed to list a user's identities.
 */
export const tUserIdentity = pgTable(
  'user_identity',
  {
    provider: text('provider').$type<IdentityProvider>().notNull(),
    subject: text('subject').notNull(),
    userId: text('user_id').notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.subject, table.provider] }),
    index('user_identity_user_id_idx').on(table.userId),
  ],
);

/** Indexed on `inviter_id`. */
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

/**
 * `path` holds trailing-slash strings; the database validates neither ancestry nor `contentType`. The unique index
 * `article_title_idx` on (`title`, `user_id`) keeps one author's titles distinct; `user_id` and `path` are indexed.
 */
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

/** Indexed on `article_id`, `user_id`, and `path`. */
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

/**
 * Duplicate user/article pairs are permitted; counts are of relationships, not distinct users. Indexed on `user_id`
 * and on `article_id`.
 */
export const tBookmark = pgTable(
  'bookmark',
  {
    userId: text('user_id').notNull(),
    articleId: text('article_id').notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index('bookmark_user_id_idx').on(table.userId), index('bookmark_article_id_idx').on(table.articleId)],
);

/** The primary key is (`user_id`, `role_key`), so a user holds each role once; `inviter_id` is indexed. */
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

/** Omits `tUserRole`; repositories import that table directly. */
export const schema = {
  tArticle,
  tBookmark,
  tComment,
  tInviteCode,
  tPreAuthSession,
  tSession,
  tUser,
  tUserIdentity,
};

/** Transaction contexts stay inside repository operations. */
export type AppDatabase = NodePgDatabase<typeof schema>;

export type ArticleRow = typeof tArticle.$inferSelect;

export type BookmarkRow = typeof tBookmark.$inferSelect;

export type CommentRow = typeof tComment.$inferSelect;

export type InviteCodeRow = typeof tInviteCode.$inferSelect;

export type PreAuthSessionRow = typeof tPreAuthSession.$inferSelect;

export type SessionRow = typeof tSession.$inferSelect;

export type UserRow = typeof tUser.$inferSelect;

export type UserIdentityRow = typeof tUserIdentity.$inferSelect;

export type UserRoleRow = typeof tUserRole.$inferSelect;
