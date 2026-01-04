import type { Cookies } from '@sveltejs/kit';

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};

export function setAuthCookie(cookies: Cookies, session: Session) {
  cookies.set('auth_session', session.id, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    expires: session.expiresAt,
  });
}
