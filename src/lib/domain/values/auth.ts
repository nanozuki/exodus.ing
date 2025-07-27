import { z } from 'zod';

export const OAuthCookieDataSchema = z.object({
  state: z.string(),
  next: z.string().optional(),
  signUp: z
    .object({
      username: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

export type OAuthCookieData = z.infer<typeof OAuthCookieDataSchema>;

export type OAuthCookieDataInput = Omit<OAuthCookieData, 'state'>;
