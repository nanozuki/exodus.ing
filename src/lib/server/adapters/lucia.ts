import { dev } from '$app/environment';
import { StateSchema, type AuthAdapter, type State, type StateInput } from '$lib/domain/services/auth';
import type { GitHubUser } from '$lib/domain/services/user';
import { AppError } from '$lib/errors';
import { tSession, tUser, type AppDatabase, type UserModel } from '$lib/server/repositories/schema';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import type { Cookies } from '@sveltejs/kit';
import { generateState, GitHub, OAuth2RequestError } from 'arctic';
import { Lucia, type User } from 'lucia';
import type { Config } from '$lib/server/config';

declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof getLucia>;
    DatabaseUserAttributes: UserModel;
  }
}

function getLucia(db: AppDatabase) {
  const authAdapter = new DrizzlePostgreSQLAdapter(db, tSession, tUser);
  const lucia = new Lucia(authAdapter, {
    sessionCookie: {
      attributes: {
        secure: !dev, // whether to use HTTPS
      },
    },
    // convert user attributes to session attributes, finally stored in locals.
    getUserAttributes: (user) => {
      const { id, username, githubId, name, aboutMe } = user;
      return { id, username, githubId, name, aboutMe };
    },
  });
  return lucia;
}

interface GithubCodeResponse {
  id: number;
  login: string;
}

const SESSION_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export class LuciaAuthService implements AuthAdapter {
  private lucia: ReturnType<typeof getLucia>;
  private github: GitHub;
  private clearedAt: number;

  constructor(db: AppDatabase, config: Config) {
    this.lucia = getLucia(db);
    this.github = new GitHub(
      config.EXODUSING_GITHUB_ID,
      config.EXODUSING_GITHUB_SECRET,
      `${config.EXODUSING_HOST}/auth/github/callback`,
    );
    this.clearedAt = Date.now() - SESSION_CLEANUP_INTERVAL;
  }

  async loadSession(cookies: Cookies): Promise<User | null> {
    const sessionId = cookies.get(this.lucia.sessionCookieName);
    if (!sessionId) {
      return null;
    }
    if (Date.now() - this.clearedAt > SESSION_CLEANUP_INTERVAL) {
      this.clearedAt = Date.now();
      await this.lucia.deleteExpiredSessions();
    }
    const { session, user } = await this.lucia.validateSession(sessionId);
    if (session && session.fresh) {
      const { name, value, attributes } = this.lucia.createSessionCookie(session.id);
      cookies.set(name, value, { ...attributes, path: '/' });
    }
    if (!session) {
      const { name, value, attributes } = this.lucia.createBlankSessionCookie();
      cookies.set(name, value, { ...attributes, path: '/' });
    }
    return user;
  }

  async setSession(cookies: Cookies, userId: string): Promise<void> {
    const session = await this.lucia.createSession(userId, {});
    const { name, value, attributes } = this.lucia.createSessionCookie(session.id);
    cookies.set(name, value, { ...attributes, path: '/' });
  }

  async getAuthState(cookies: Cookies): Promise<State> {
    const stateCookie = cookies.get('github_oauth_state');
    if (!stateCookie) {
      return AppError.OAuthValidationError('state cookie not found').throw();
    }
    const stateResult = StateSchema.safeParse(JSON.parse(stateCookie));
    if (!stateResult.success) {
      return AppError.OAuthValidationError('state cookie parse error').throw();
    }
    return stateResult.data;
  }

  async createGithubAuthUrl(cookies: Cookies, input: StateInput): Promise<URL> {
    const { next, signUp } = input;
    const state = { state: generateState(), next, signUp };
    const stateJson = JSON.stringify(state);
    cookies.set('github_oauth_state', stateJson, {
      path: '/',
      secure: import.meta.env.PROD,
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
    });
    const authUrl = this.github.createAuthorizationURL(state.state, []);
    return authUrl;
  }

  async getGitHubUserByCode(code: string): Promise<GitHubUser> {
    try {
      const tokens = await this.github.validateAuthorizationCode(code);
      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
          Accept: 'application/json',
          'User-Agent': 'exodus.ing',
        },
      });
      const res = (await githubUserResponse.json()) as GithubCodeResponse;
      return { id: res.id, username: res.login };
    } catch (e) {
      if (e instanceof OAuth2RequestError) {
        return AppError.OAuthValidationError(e.message).throw();
      }
      if (e instanceof Error) {
        return AppError.InternalServerError(e.message).throw();
      }
      return AppError.InternalServerError().throw();
    }
  }
}
