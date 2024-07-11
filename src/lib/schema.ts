import { sqliteTable, blob, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: blob('id', { mode: 'buffer' }).primaryKey(), // UUIDv7
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const site = sqliteTable('site', {
	id: blob('id', { mode: 'buffer' }).primaryKey(), // UUIDv7
	userId: blob('user_id').references(() => user.id),
	name: text('name').notNull().unique()
});

export type ArticleContentType = 'markdown' | 'html';

export const article = sqliteTable(
	'article',
	{
		id: blob('id', { mode: 'buffer' }).primaryKey(), // UUIDv7
		userId: blob('user_id').references(() => user.id),
		siteId: blob('site_id').references(() => site.id),
		title: text('title').notNull(),
		content: text('content').notNull(),
		contentType: text('content_type').$type<ArticleContentType>().notNull()
	},
	(table) => {
		return {
			articleTitleIdx: uniqueIndex('article_title_idx').on(table.title, table.siteId)
		};
	}
);
