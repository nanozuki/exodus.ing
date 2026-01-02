import z from 'zod';

export const createOrUpdateExternalArticleSchema = z.object({
  url: z.url(),
  title: z.string(),
  articleId: z.string().optional(),
  replyToId: z.string().optional(),
});
