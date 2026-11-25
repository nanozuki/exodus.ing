import { form, getRequestEvent, query } from '$app/server';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import z from 'zod';
import { getConfig } from '#lib/server/config.js';
import { db } from '#lib/server/registry.js';
import { now } from '#lib/server/adapters/clock.js';
import { random } from '#lib/server/adapters/random.js';
import { deleteSignUpCookie, readSignUpCookie, sanitizeNext, setAuthCookie } from '#lib/server/transport/auth.js';
import { cancelSignUp as cancelSignUpUseCase, completeSignUp, fetchSignUpPrefill } from '#lib/server/use-cases/user.js';

/**
 * Returns the sign-up form's initial `username` and `name` from `fetchSignUpPrefill` for the sign-up cookie's token.
 * Without a live pending sign-up, redirects 302 to `/auth` and leaves the cookie, since a query cannot write cookies;
 * it expires with the pending sign-up.
 */
export const loadPageData = query(async (): Promise<{ username: string; name: string }> => {
  const { cookies } = getRequestEvent();
  const token = readSignUpCookie(cookies);
  const prefill = token ? await fetchSignUpPrefill({ db, now }, { token }) : null;
  if (!prefill) redirect(302, '/auth');
  return prefill;
});

const submitSignUpSchema = z.object({
  username: z.string().trim().min(1, '用户名不能为空'),
  name: z.string().trim().min(1, '昵称不能为空'),
});

/**
 * Creates the account for the pending sign-up with the trimmed `username` and `name`, sets the auth cookie, deletes the
 * sign-up cookie, and redirects 303 to the sanitized stored `next`. PARAMETER_INVALID `username` and `name` become
 * field issues. A missing, expired, or already used pending sign-up creates nothing, deletes the cookie, and redirects
 * 303 to `/auth`. Other errors propagate. Field issues and other errors keep the pending sign-up and its cookie.
 */
export const submitSignUp = form(submitSignUpSchema, async ({ username, name }, issue) => {
  const { cookies } = getRequestEvent();
  const token = readSignUpCookie(cookies);
  let result: Awaited<ReturnType<typeof completeSignUp>> = null;
  if (token) {
    try {
      result = await completeSignUp({ db, now, random }, { token, username, name });
    } catch (error) {
      if (isHttpError(error) && error.body.detail?.tag === 'PARAMETER_INVALID') {
        const fields = error.body.detail.value;
        if (fields.username) invalid(issue.username(fields.username));
        if (fields.name) invalid(issue.name(fields.name));
      }
      throw error;
    }
  }
  deleteSignUpCookie(cookies);
  if (!result) redirect(303, '/auth');
  setAuthCookie(cookies, { token: result.token, expiresAt: result.session.expiresAt });
  // SvelteKit treats an absolute URL as external unless it matches the request origin, so allow the app's own origin.
  const { appUrl } = getConfig();
  redirect(303, sanitizeNext(result.next, appUrl), { external: [appUrl] });
});

/**
 * Deletes the live pending sign-up, if any, and the sign-up cookie, and redirects 303 to `/auth`. An expired pending
 * sign-up stays stored until the next one is created.
 */
export const cancelSignUp = form(async () => {
  const { cookies } = getRequestEvent();
  const token = readSignUpCookie(cookies);
  if (token) await cancelSignUpUseCase({ db, now }, { token });
  deleteSignUpCookie(cookies);
  redirect(303, '/auth');
});
