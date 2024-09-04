import type { tArticle, tUser } from './schema';

export type User = typeof tUser.$inferSelect;
export type Article = typeof tArticle.$inferSelect;
