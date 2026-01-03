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

// Schema for pending registration data stored in cookie after OAuth callback for new users
export const PendingRegistrationSchema = z.object({
  githubId: z.number(),
  githubUsername: z.string(),
  next: z.string().optional(),
});

export type PendingRegistration = z.infer<typeof PendingRegistrationSchema>;
