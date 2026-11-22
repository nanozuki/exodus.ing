import type { Config } from '#lib/server/config.js';
import { GitHubOAuth } from './github_auth';
import { resolveTxt } from './name_resolver';

/**
 * Constructs a fresh `GitHubOAuth` and exposes the shared DNS lookup. Construction makes no network request; adapters
 * make them only when their methods are invoked.
 */
export function createAdapterSet(config: Config) {
  return {
    githubOAuth: new GitHubOAuth(config),
    name_resolver: { resolveTxt },
  };
}

export type AdapterSet = ReturnType<typeof createAdapterSet>;
