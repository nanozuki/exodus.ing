import { throwError } from '$lib/errors';

export type Config = {
  EXODUSING_GITHUB_ID: string;
  EXODUSING_GITHUB_SECRET: string;
  // EXODUSING_GOOGLE_ID: string;
  // EXODUSING_GOOGLE_SECRET: string;
  EXODUSING_HOST: string;
  EXODUSING_DATABASE: string;
};

export function getConfig(): Config {
  const getEnv = (key: string): string => {
    const value = process.env[key];
    if (typeof value !== 'string') {
      return throwError('MISSING_CONFIG', { item: key });
    }
    return value;
  };
  const config: Config = {
    EXODUSING_GITHUB_ID: getEnv('EXODUSING_GITHUB_ID'),
    EXODUSING_GITHUB_SECRET: getEnv('EXODUSING_GITHUB_SECRET'),
    // EXODUSING_GOOGLE_ID: getEnv('EXODUSING_GOOGLE_ID'),
    // EXODUSING_GOOGLE_SECRET: getEnv('EXODUSING_GOOGLE_SECRET'),
    EXODUSING_HOST: getEnv('EXODUSING_HOST'),
    EXODUSING_DATABASE: getEnv('EXODUSING_DATABASE'),
  };
  return config;
}
