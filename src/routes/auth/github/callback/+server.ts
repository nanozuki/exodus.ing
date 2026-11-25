import type { RequestEvent } from '@sveltejs/kit';
import { readGitHubCallbackData, sanitizeNext, setAuthCookie, setSignUpCookie } from '#lib/server/transport/auth.js';
import { getConfig } from '#lib/server/config.js';
import { adapters, db } from '#lib/server/registry.js';
import { now } from '#lib/server/adapters/clock.js';
import { random } from '#lib/server/adapters/random.js';
import { signInWithIdentity } from '#lib/server/use-cases/user.js';

/**
 * Validates the callback's code and state (the state cookie is deleted on every path), fetches the GitHub identity,
 * and passes it to `signInWithIdentity` as provider `github` with its decimal ID as subject, its login and display
 * name as hints, and `next` from the state. A known identity gets the auth cookie and a 302 to the sanitized `next`.
 * An unknown identity gets the sign-up cookie and a 302 to `/auth/sign-up`; no user is created. Failures propagate to
 * SvelteKit's default error handling.
 */
export async function GET(request: RequestEvent): Promise<Response> {
  const { code, data } = readGitHubCallbackData(request);
  const githubUser = await adapters.githubOAuth.getUser(code);
  const result = await signInWithIdentity(
    { db, now, random },
    {
      identity: { provider: 'github', subject: String(githubUser.id) },
      hints: { username: githubUser.username, name: githubUser.name ?? undefined },
      next: data.next,
    },
  );
  const { appUrl } = getConfig();
  let location: string;
  if (result.status === 'signed_in') {
    setAuthCookie(request.cookies, { token: result.token, expiresAt: result.session.expiresAt });
    location = sanitizeNext(data.next, appUrl);
  } else {
    setSignUpCookie(request.cookies, { token: result.token, expiresAt: result.session.expiresAt });
    location = `${new URL(appUrl).origin}/auth/sign-up`;
  }
  return new Response(null, { status: 302, headers: { Location: location } });
}
