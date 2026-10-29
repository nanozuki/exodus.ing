import { throwError } from '#lib/errors.js';
import type { Config } from '#lib/server/config.js';
import { GitHub, OAuth2RequestError } from 'arctic';

export type GitHubUser = { id: number; username: string };

export class GitHubOAuth {
  private github: GitHub;

  constructor(config: Config) {
    this.github = new GitHub(config.githubClientId, config.githubClientSecret, `${config.appUrl}/auth/github/callback`);
  }

  createAuthUrl(state: string): URL {
    return this.github.createAuthorizationURL(state, []);
  }

  // Validate callback state before calling. Provider rejection is BAD_REQUEST; other exchange failures are
  // INTERNAL_SERVER_ERROR.
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
