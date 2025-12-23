import { OAuthCookieDataSchema, type OAuthCookieData, type OAuthCookieDataInput } from '$lib/domain/values/auth';
import { throwError } from '$lib/errors';
import type { Config } from '$lib/server/config';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { generateState, GitHub, OAuth2RequestError } from 'arctic';

const GITHUB_OAUTH_COOKIE_NAME = 'github_oauth_state';

export type GitHubUser = {
  id: number;
  username: string;
};

export type OAuthResult = {
  user: GitHubUser;
  data: OAuthCookieData;
};

export class GitHubOAuth {
  private github: GitHub;

  constructor(config: Config) {
    this.github = new GitHub(
      config.EXODUSING_GITHUB_ID,
      config.EXODUSING_GITHUB_SECRET,
      `${config.EXODUSING_HOST}/auth/github/callback`,
    );
  }

  createAuthUrl(cookies: Cookies, input: OAuthCookieDataInput): URL {
    const state = { state: generateState(), ...input };
    const stateJson = JSON.stringify(state);
    cookies.set(GITHUB_OAUTH_COOKIE_NAME, stateJson, {
      path: '/',
      secure: import.meta.env.PROD,
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
    });
    const authUrl = this.github.createAuthorizationURL(state.state, []);
    return authUrl;
  }

  // handleCallback parse the github oauth callback request
  // 1. get code and state and cookies from request
  // 2. check if state in url equals to state in cookies
  // 3. check code by github api
  // 4. get user info from github api
  async handleCallback(request: RequestEvent): Promise<OAuthResult> {
    const { cookies, url } = request;
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) {
      return throwError('BAD_REQUEST', 'OAuth 验证错误: code or state is empty');
    }
    const stateCookie = cookies.get(GITHUB_OAUTH_COOKIE_NAME);
    if (!stateCookie) {
      return throwError('BAD_REQUEST', 'OAuth 验证错误: state cookie not found');
    }
    const stateResult = OAuthCookieDataSchema.safeParse(JSON.parse(stateCookie));
    if (!stateResult.success) {
      return throwError('BAD_REQUEST', 'OAuth 验证错误: state cookie parse error');
    }
    const cookiesData = stateResult.data;
    if (state !== cookiesData.state) {
      return throwError('BAD_REQUEST', 'OAuth 验证错误: invalid state');
    }
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
      return { user: { id: res.id, username: res.login }, data: cookiesData };
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
