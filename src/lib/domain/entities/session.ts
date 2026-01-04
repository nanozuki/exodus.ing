import type { Cookies } from '@sveltejs/kit';

export const AUTH_COOKIE_NAME = 'auth_session';

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};

export function setAuthCookie(cookies: Cookies, session: Session) {
  cookies.set(AUTH_COOKIE_NAME, session.id, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    expires: session.expiresAt,
  });
}
