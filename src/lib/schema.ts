import { integer, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const tUser = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  username: text('username').notNull().unique(),
  githubId: integer('github_id').unique(),
  name: text('name').notNull(),
  aboutMe: text('about_me').notNull(),
});

export const tSession = sqliteTable(
  'session',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => ({
    sessionUserIdIdx: index('session_user_id_idx').on(table.userId),
  }),
);

export const tInviteCode = sqliteTable('invite_code', {
  id: integer('id').primaryKey(),
  code: text('code').notNull().unique(),
  validFrom: integer('valid_from', { mode: 'timestamp_ms' }).notNull(),
  validTo: integer('valid_to', { mode: 'timestamp_ms' }).notNull(),
});

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
  },
  (table) => ({
    articleTitleIdx: uniqueIndex('article_title_idx').on(table.title, table.userId),
    articleUserIdIdx: index('article_user_id_idx').on(table.userId),
  }),
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
  (table) => ({
    userDomainUserIdIdx: index('user_domain_user_id_idx').on(table.userId),
  }),
);
