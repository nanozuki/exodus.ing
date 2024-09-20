import type { tArticle, tUser, tUserDomain } from './schema';

export type User = typeof tUser.$inferSelect;
export type Article = typeof tArticle.$inferSelect;
export type UserDomain = typeof tUserDomain.$inferSelect;
