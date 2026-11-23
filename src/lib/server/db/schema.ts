// schema.ts declares the Drizzle tables and their inferred row types; insert shapes come from each table's
// $inferInsert. `createdAt` and `updatedAt` columns are required and default to now. Tables declare no foreign keys.

import { index, integer, pgTable, text, uniqueIndex, primaryKey, timestamp, serial } from 'drizzle-orm/pg-core';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ArticleContentType } from '#lib/models/article.js';

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
    secretHash: text('secret_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [index('session_user_id_idx').on(table.userId), index('expires_at_idx').on(table.expiresAt)],
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

/** `path` holds trailing-slash strings; the database validates neither ancestry nor `contentType`. */
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

/** Duplicate user/article pairs are permitted; counts are of relationships, not distinct users. */
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

/** Omits `tUserRole`; repositories import that table directly. */
export const schema = {
  tArticle,
  tBookmark,
  tComment,
  tInviteCode,
  tSession,
  tUser,
};

/** Transaction contexts stay inside repository operations. */
export type AppDatabase = NodePgDatabase<typeof schema>;

export type ArticleRow = typeof tArticle.$inferSelect;

export type BookmarkRow = typeof tBookmark.$inferSelect;

export type CommentRow = typeof tComment.$inferSelect;

export type InviteCodeRow = typeof tInviteCode.$inferSelect;

export type SessionRow = typeof tSession.$inferSelect;

export type UserRow = typeof tUser.$inferSelect;

export type UserRoleRow = typeof tUserRole.$inferSelect;
