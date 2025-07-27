import type { Config } from '$lib/server/config';
import { GitHubOAuth } from '$lib/server/adapters/github_auth';
import { resolveTxt } from '$lib/server/adapters/name_resolver';

export function createAdapterSet(config: Config) {
  return {
    githubOAuth: new GitHubOAuth(config),
    name_resolver: { resolveTxt },
  };
}

export type AdapterSet = ReturnType<typeof createAdapterSet>;
