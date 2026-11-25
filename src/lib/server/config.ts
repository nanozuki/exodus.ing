import { z } from 'zod';
import { throwError } from '#lib/errors.js';

export type Config = {
  githubClientId: string;
  githubClientSecret: string;
  appUrl: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    /** Best effort: the driver uses channel binding when the server offers it and falls back otherwise. */
    enableChannelBinding: boolean;
  };
};

const envSchema = z.object({
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  APP_URL: z.string(),
  PGHOST: z.string(),
  PGPORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
  PGDATABASE: z.string(),
  PGCHANNELBINDING: z.string().optional(),
});

/**
 * Reads configuration from `env` when called, parsing it with zod. GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, APP_URL,
 * PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE are required, and an empty string is accepted; PGPORT must be
 * decimal digits for an integer from 1 to 65535. A missing or invalid variable throws MISSING_CONFIG naming the first
 * one. PGCHANNELBINDING `prefer` or `require` enables `enableChannelBinding`; any other value, or none, disables it, so
 * `require` is not enforced.
 */
export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    return throwError('MISSING_CONFIG', { item: String(result.error.issues[0].path[0]) });
  }
  const vars = result.data;
  return {
    githubClientId: vars.GITHUB_CLIENT_ID,
    githubClientSecret: vars.GITHUB_CLIENT_SECRET,
    appUrl: vars.APP_URL,
    database: {
      host: vars.PGHOST,
      port: vars.PGPORT,
      user: vars.PGUSER,
      password: vars.PGPASSWORD,
      database: vars.PGDATABASE,
      enableChannelBinding: vars.PGCHANNELBINDING === 'prefer' || vars.PGCHANNELBINDING === 'require',
    },
  };
}
