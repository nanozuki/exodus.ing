import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').notNull().primaryKey(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
	username: text('username').notNull().unique(),
	githubId: integer('github_id').unique(),
});

export type User = typeof user.$inferSelect;

export const session = sqliteTable('session', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at').notNull(),
});

export const inviteCode = sqliteTable('invite_code', {
	id: integer('id').primaryKey(),
	code: text('code').notNull().unique(),
	validFrom: integer('valid_from', { mode: 'timestamp_ms' }).notNull(),
	validTo: integer('valid_to', { mode: 'timestamp_ms' }).notNull(),
});

export type ArticleContentType = 'markdown' | 'html';

export const article = sqliteTable(
	'article',
	{
		id: text('id').primaryKey(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
		userId: text('user_id').references(() => user.id),
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
