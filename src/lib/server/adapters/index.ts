import type { Config } from '#lib/server/config.js';
import { GitHubOAuth } from './github_auth';
import { resolveTxt } from './name_resolver';

export function createAdapterSet(config: Config) {
  return {
    githubOAuth: new GitHubOAuth(config),
    name_resolver: { resolveTxt },
  };
}

export type AdapterSet = ReturnType<typeof createAdapterSet>;
