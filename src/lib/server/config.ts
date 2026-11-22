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

/**
 * Reads configuration from `env` when called. GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, APP_URL, PGHOST, PGPORT, PGUSER,
 * PGPASSWORD, and PGDATABASE are required: a missing one throws MISSING_CONFIG, while an empty string is accepted.
 * PGPORT is converted with `Number`, without range or NaN checks. PGCHANNELBINDING `prefer` or `require` enables
 * `enableChannelBinding`; any other value, or none, disables it, so `require` is not enforced.
 */
export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const getEnv = (key: string): string => {
    const value = env[key];
    if (typeof value !== 'string') {
      return throwError('MISSING_CONFIG', { item: key });
    }
    return value;
  };
  const config: Config = {
    githubClientId: getEnv('GITHUB_CLIENT_ID'),
    githubClientSecret: getEnv('GITHUB_CLIENT_SECRET'),
    appUrl: getEnv('APP_URL'),
    database: {
      host: getEnv('PGHOST'),
      port: Number(getEnv('PGPORT')),
      user: getEnv('PGUSER'),
      password: getEnv('PGPASSWORD'),
      database: getEnv('PGDATABASE'),
      enableChannelBinding: env.PGCHANNELBINDING === 'prefer' || env.PGCHANNELBINDING === 'require',
    },
  };
  return config;
}
