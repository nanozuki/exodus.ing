import { env } from '$env/dynamic/private';
import { AppError } from '$lib/errors';

export type Config = {
  EXODUSING_GITHUB_ID: string;
  EXODUSING_GITHUB_SECRET: string;
  EXODUSING_HOST: string;
  EXODUSING_DATABASE: string;
};

export function getConfig(): Config {
  const getEnv = (key: string): string => {
    const value = env[key];
    if (typeof value !== 'string') {
      return AppError.MissingConfig(key).throw();
    }
    return value;
  };
  const config: Config = {
    EXODUSING_GITHUB_ID: getEnv('EXODUSING_GITHUB_ID'),
    EXODUSING_GITHUB_SECRET: getEnv('EXODUSING_GITHUB_SECRET'),
    EXODUSING_HOST: getEnv('EXODUSING_HOST'),
    EXODUSING_DATABASE: getEnv('EXODUSING_DATABASE'),
  };
  return config;
}
