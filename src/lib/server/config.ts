/** Server configuration shared with Drizzle and database management scripts. */
import { throwError } from '../errors';

export type Config = {
  githubClientId: string;
  githubClientSecret: string;
  // googleClientId: string;
  // googleClientSecret: string;
  appUrl: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
};

/** Read application settings and PostgreSQL connection settings from the environment. */
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
    // googleClientId: getEnv('GOOGLE_CLIENT_ID'),
    // googleClientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
    appUrl: getEnv('APP_URL'),
    database: {
      host: getEnv('PGHOST'),
      port: Number(getEnv('PGPORT')),
      user: getEnv('PGUSER'),
      password: getEnv('PGPASSWORD'),
      database: getEnv('PGDATABASE'),
    },
  };
  return config;
}
