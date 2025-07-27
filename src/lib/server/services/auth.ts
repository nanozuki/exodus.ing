import type { Cookies } from '@sveltejs/kit';
import type { User, GitHubUser } from '$lib/domain/entities/user';
import { throwError } from '$lib/errors';
import { z } from 'zod';
import { repositories } from '$lib/server/registry';
import type { StateInput } from '$lib/domain/values/auth';

export const StateSchema = z.object({
  state: z.string(),
  next: z.string().optional(),
  signUp: z
    .object({
      username: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

export type State = z.infer<typeof StateSchema>;

// TODO: move the Cookies out of the domain layer
export interface AuthAdapter {
  // Session/State operations
  loadSession(cookies: Cookies): Promise<User | null>;
  setSession(cookies: Cookies, userId: string): Promise<void>;
  getAuthState(cookies: Cookies): Promise<State>;
  // GitHub OAuth operations
  createGithubAuthUrl(cookies: Cookies, input: StateInput): Promise<URL>;
  getGitHubUserByCode(code: string): Promise<GitHubUser>;
}

export class AuthService {
  constructor(private readonly auth: AuthAdapter) {}

  async loadSession(cookies: Cookies): Promise<User | null> {
    return await this.auth.loadSession(cookies);
  }

  async authByGithub(cookies: Cookies, input: StateInput): Promise<URL> {
    const username = input.signUp?.username;
    const name = input.signUp?.name || username;
    if (username) {
      if (username.startsWith('@')) {
        return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
      }
      const user = await repositories.user.findByUsername(username);
      if (user) {
        return throwError('PARAMETER_INVALID', { username: '用户名已存在' });
      }
    }
    if (name) {
      const user = await repositories.user.findByName(name);
      if (user) {
        return throwError('PARAMETER_INVALID', { name: '昵称已存在' });
      }
    }
    const authUrl = await this.auth.createGithubAuthUrl(cookies, input);
    return authUrl;
  }

  async handleGithubCallback(cookies: Cookies, code: string, state: string): Promise<State> {
    const storedState = await this.auth.getAuthState(cookies);
    if (state !== storedState.state) {
      return throwError('BAD_REQUEST', 'OAuth 验证错误: invalid state');
    }
    const ghUser = await this.auth.getGitHubUserByCode(code);
    const user = await repositories.user.findByGitHubId(ghUser.id);

    if (user) {
      // exsiting user
      await this.auth.setSession(cookies, user.id);
      return storedState;
    }

    // new user, create user
    const newUser = await repositories.user.create({
      username: storedState.signUp?.username || ghUser.username,
      name: storedState.signUp?.name || ghUser.username,
      githubId: ghUser.id,
      aboutMe: '',
    });
    if (newUser.username.startsWith('@')) {
      return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
    }
    await this.auth.setSession(cookies, newUser.id);
    return storedState;
  }
}
