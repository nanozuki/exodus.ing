import { throwError } from '../errors';

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
    // Uses channel binding when offered; the driver may fall back without it.
    enableChannelBinding: boolean;
  };
};

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
