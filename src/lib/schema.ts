import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const tUser = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  username: text('username').notNull().unique(),
  githubId: integer('github_id').unique(),
  name: text('name').notNull(),
  aboutMe: text('about_me').notNull(),
});

export const tSession = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => tUser.id, { onUpdate: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

export const tInviteCode = sqliteTable('invite_code', {
  id: integer('id').primaryKey(),
  code: text('code').notNull().unique(),
  validFrom: integer('valid_from', { mode: 'timestamp_ms' }).notNull(),
  validTo: integer('valid_to', { mode: 'timestamp_ms' }).notNull(),
});

export type ArticleContentType = 'markdown' | 'html';

export const tArticle = sqliteTable(
  'article',
  {
    id: text('id').notNull().primaryKey(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => tUser.id, { onUpdate: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    contentType: text('content_type').$type<ArticleContentType>().notNull(),
  },
  (table) => {
    return {
      articleTitleIdx: uniqueIndex('article_title_idx').on(table.title, table.userId),
    };
  },
);
