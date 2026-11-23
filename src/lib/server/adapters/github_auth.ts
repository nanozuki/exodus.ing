import { throwError } from '#lib/errors.js';
import type { Config } from '#lib/server/config.js';
import { GitHub, OAuth2RequestError } from 'arctic';

/** `username` is the GitHub login. */
export type GitHubUser = { id: number; username: string };

/**
 * GitHub OAuth client redirecting to `${appUrl}/auth/github/callback`. Its methods are independent of requests and
 * cookies.
 */
export class GitHubOAuth {
  private github: GitHub;

  constructor(config: Config) {
    this.github = new GitHub(config.githubClientId, config.githubClientSecret, `${config.appUrl}/auth/github/callback`);
  }

  /** Builds the authorization URL for `state`, requesting no scopes. */
  createAuthUrl(state: string): URL {
    return this.github.createAuthorizationURL(state, []);
  }

  /**
   * Exchanges `code` for an access token and fetches the GitHub user. Validate callback state before calling. Provider
   * rejection throws BAD_REQUEST; any other exchange or fetch failure, including a non-2xx user response, throws
   * INTERNAL_SERVER_ERROR. A successful response's JSON shape is not validated.
   */
  async getUser(code: string): Promise<GitHubUser> {
    try {
      const tokens = await this.github.validateAuthorizationCode(code);
      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
          Accept: 'application/json',
          'User-Agent': 'exodus.ing',
        },
      });
      if (!githubUserResponse.ok) {
        throw new Error(`GitHub user request failed with status ${githubUserResponse.status}`);
      }
      const res = (await githubUserResponse.json()) as { id: number; login: string };
      return { id: res.id, username: res.login };
    } catch (e) {
      if (e instanceof OAuth2RequestError) {
        return throwError('BAD_REQUEST', `OAuth 验证错误: ${e.message}`);
      }
      if (e instanceof Error) {
        return throwError('INTERNAL_SERVER_ERROR', `OAuth 验证错误: ${e.message}`);
      }
      return throwError('INTERNAL_SERVER_ERROR', `OAuth 验证错误: ${e}`);
    }
  }
}
