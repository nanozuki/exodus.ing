import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { LoggedInUser } from '$lib/domain/entities/user';
import type { Session } from '$lib/domain/entities/session';
import { throwError } from '$lib/errors';
import { adapters, repositories } from '$lib/server/registry';
import type { OAuthCookieDataInput, PendingRegistration } from '$lib/domain/values/auth';
import { PendingRegistrationSchema } from '$lib/domain/values/auth';

const AUTH_COOKIE_NAME = 'auth_session';
const PENDING_REGISTRATION_COOKIE_NAME = 'pending_registration';

function setAuthCookie(cookies: Cookies, session: Session) {
  cookies.set(AUTH_COOKIE_NAME, session.id, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    expires: session.expiresAt,
  });
}

export type GithubCallbackResult =
  | { type: 'login'; next?: string }
  | { type: 'register'; next?: string; githubId: number; githubUsername: string };

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
    return adapters.githubOAuth.createAuthUrl(cookies, input);
  }

  async handleGithubCallback(request: RequestEvent): Promise<GithubCallbackResult> {
    const { user: ghUser, data: cookieData } = await adapters.githubOAuth.handleCallback(request);
    const { cookies } = request;
    const user = await repositories.user.findByGitHubId(ghUser.id);
    if (!user) {
      // New user: store pending registration data in cookie and redirect to registration page
      const pendingData: PendingRegistration = {
        githubId: ghUser.id,
        githubUsername: ghUser.username,
        next: cookieData.next,
      };
      cookies.set(PENDING_REGISTRATION_COOKIE_NAME, JSON.stringify(pendingData), {
        path: '/',
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: 'lax',
      });
      return { type: 'register', next: cookieData.next, githubId: ghUser.id, githubUsername: ghUser.username };
    }
    // Existing user: login
    const session = await repositories.session.create(user.id);
    setAuthCookie(cookies, session);
    return { type: 'login', next: cookieData.next };
  }

  getPendingRegistration(cookies: Cookies): PendingRegistration | null {
    const cookie = cookies.get(PENDING_REGISTRATION_COOKIE_NAME);
    if (!cookie) {
      return null;
    }
    const result = PendingRegistrationSchema.safeParse(JSON.parse(cookie));
    if (!result.success) {
      return null;
    }
    return result.data;
  }

  clearPendingRegistration(cookies: Cookies): void {
    cookies.delete(PENDING_REGISTRATION_COOKIE_NAME, { path: '/' });
  }

  async completeRegistration(
    cookies: Cookies,
    pendingData: PendingRegistration,
    username: string,
    name: string,
  ): Promise<void> {
    // Validate username
    if (username.startsWith('@')) {
      return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
    }
    const existingUserByUsername = await repositories.user.findByUsername(username);
    if (existingUserByUsername) {
      return throwError('PARAMETER_INVALID', { username: '用户名已存在' });
    }
    const existingUserByName = await repositories.user.findByName(name);
    if (existingUserByName) {
      return throwError('PARAMETER_INVALID', { name: '昵称已存在' });
    }

    // Create user
    const user = await repositories.user.create({
      username,
      name,
      githubId: pendingData.githubId,
      aboutMe: '',
    });

    // Create session and set cookie
    const session = await repositories.session.create(user.id);
    setAuthCookie(cookies, session);

    // Clear pending registration cookie
    this.clearPendingRegistration(cookies);
  }
}
