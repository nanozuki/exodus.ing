import { dev } from '$app/environment';
import { EXODUSING_GITHUB_ID, EXODUSING_GITHUB_SECRET } from '$env/static/private';
import { State, type AuthService, type GitHubUser, type SessionUser } from '$lib/domain/adapters';
import { AppError } from '$lib/errors';
import { tSession, tUser } from '$lib/server/repository/schema';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { generateState, GitHub, OAuth2RequestError } from 'arctic';
import { Lucia, type User } from 'lucia';
import type { AppD1Database, UserModel } from '../repository/schema';

declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof getLucia>;
    DatabaseUserAttributes: UserModel;
  }
}

function getLucia(db: AppD1Database) {
  const authAdapter = new DrizzleSQLiteAdapter(db, tSession, tUser);
  const lucia = new Lucia(authAdapter, {
    sessionCookie: {
      attributes: {
        secure: !dev, // whether to use HTTPS
      },
    },
    // convert user attributes to session attributes, finally stored in locals.
    getUserAttributes: ({ githubId, username, name }) => {
      return { githubId, username, name };
    },
  });
  return lucia;
}

export class LuciaAuthService implements AuthService {
  private lucia: ReturnType<typeof getLucia>;
  private github: GitHub;
  private cookies: Cookies;
  public loggedInUser: SessionUser | null = null;

  private constructor(event: RequestEvent, db: AppD1Database) {
    this.lucia = getLucia(db);
    this.github = new GitHub(EXODUSING_GITHUB_ID, EXODUSING_GITHUB_SECRET);
    this.cookies = event.cookies;
  }

  static async Load(event: RequestEvent, db: AppD1Database): Promise<LuciaAuthService> {
    const auth = new LuciaAuthService(event, db);
    await auth.loadSession();
    return auth;
  }

  requireLoggedInUser(): User {
    if (!this.loggedInUser) {
      return AppError.Unauthorized().throw();
    }
    return this.loggedInUser;
  }

  async loadSession(): Promise<void> {
    const sessionId = this.cookies.get(this.lucia.sessionCookieName);
    if (!sessionId) {
      return;
    }
    await this.lucia.deleteExpiredSessions();
    const { session, user } = await this.lucia.validateSession(sessionId);
    this.loggedInUser = user;
    if (session && session.fresh) {
      const { name, value, attributes } = this.lucia.createSessionCookie(session.id);
      this.cookies.set(name, value, { ...attributes, path: '/' });
    }
    if (!session) {
      const { name, value, attributes } = this.lucia.createBlankSessionCookie();
      this.cookies.set(name, value, { ...attributes, path: '/' });
    }
  }

  async setSession(userId: string): Promise<void> {
    const session = await this.lucia.createSession(userId, {});
    const { name, value, attributes } = this.lucia.createSessionCookie(session.id);
    this.cookies.set(name, value, { ...attributes, path: '/' });
  }

  async getState(): Promise<State> {
    const stateCookie = this.cookies.get('github_oauth_state');
    if (!stateCookie) {
      return AppError.OAuthValidationError('state cookie not found').throw();
    }
    const stateResult = State.safeParse(JSON.parse(stateCookie));
    if (!stateResult.success) {
      return AppError.OAuthValidationError('state cookie parse error').throw();
    }
    return stateResult.data;
  }

  async createAndSetState(inviteCode?: string): Promise<string> {
    const state = {
      state: generateState(),
      inviteCode,
    };
    const stateJson = JSON.stringify(state);
    this.cookies.set('github_oauth_state', stateJson, {
      path: '/',
      secure: import.meta.env.PROD,
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
    });
    return state.state;
  }

  async createGithubAuthUrl(state: string): Promise<URL> {
    return await this.github.createAuthorizationURL(state);
  }

  async validateGithubCode(code: string): Promise<GitHubUser> {
    try {
      const tokens = await this.github.validateAuthorizationCode(code);
      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: 'application/json',
          'User-Agent': 'exodus.ing',
        },
      });
      return await githubUserResponse.json();
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
