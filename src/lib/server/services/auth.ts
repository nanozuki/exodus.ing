import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { LoggedInUser } from '$lib/domain/entities/user';
import type { Session } from '$lib/domain/entities/session';
import { throwError } from '$lib/errors';
import { adapters, repositories } from '$lib/server/registry';
import type { OAuthCookieData, OAuthCookieDataInput } from '$lib/domain/values/auth';

const AUTH_COOKIE_NAME = 'auth_session';

function setAuthCookie(cookies: Cookies, session: Session) {
  cookies.set(AUTH_COOKIE_NAME, session.id, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    expires: session.expiresAt,
  });
}

export class AuthService {
  constructor() {}

  async loadSession(cookies: Cookies): Promise<LoggedInUser | null> {
    const sessionId = cookies.get(AUTH_COOKIE_NAME);
    if (!sessionId) {
      return null;
    }
    const result = await repositories.session.validateSession(sessionId);
    if (!result) {
      return null;
    }
    if (result.refresh) {
      setAuthCookie(cookies, result.session);
    }
    const [user, roles] = await Promise.all([
      repositories.user.findById(result.session.userId),
      repositories.role.getUserRoles(result.session.userId),
    ]);
    return user ? ({ ...user, roles } as LoggedInUser) : null;
  }

  async authByGithub(cookies: Cookies, input: OAuthCookieDataInput): Promise<URL> {
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
    return adapters.githubOAuth.createAuthUrl(cookies, input);
  }

  async handleGithubCallback(request: RequestEvent): Promise<OAuthCookieData> {
    const { user: ghUser, data: cookieData } = await adapters.githubOAuth.handleCallback(request);
    const { cookies } = request;
    let user = await repositories.user.findByGitHubId(ghUser.id);
    if (!user) {
      // new user, create user
      const username = cookieData.signUp?.username || ghUser.username;
      const name = cookieData.signUp?.name || username;
      if (username.startsWith('@')) {
        return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
      }
      user = await repositories.user.create({
        username,
        name,
        githubId: ghUser.id,
        aboutMe: '',
      });
    }
    const session = await repositories.session.create(user.id);
    setAuthCookie(cookies, session);
    return cookieData;
  }
}
