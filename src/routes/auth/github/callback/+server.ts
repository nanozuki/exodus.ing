import { InvalidInviteCode, InviteCodeMissed, OAuthValidationError } from '$lib/errors';
import {
	generateSessionCookie,
	parseStateCookie,
	validateGitHubCode,
	validateInviteCode,
} from '$lib/server/auth';
import { createUserByGitHub, getUserByGitHubId } from '$lib/server/user';
import { error, type RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = parseStateCookie(event.cookies.get('github_oauth_state'));
	if (!code || !state || !storedState || state !== storedState.state) {
		error(400, OAuthValidationError('check callback state'));
	}

	const gitHubUser = await validateGitHubCode(event.locals, code);
	const existingUser = await getUserByGitHubId(event.locals, gitHubUser.id);

	if (existingUser) {
		const cookie = await generateSessionCookie(event.locals, existingUser.id);
		event.cookies.set(cookie.name, cookie.value, { ...cookie.attributes });
	} else {
		if (!storedState.inviteCode) {
			error(400, InviteCodeMissed());
		}
		const valid = await validateInviteCode(event.locals, storedState.inviteCode);
		if (!valid) {
			error(400, InvalidInviteCode());
		}

		const user = await createUserByGitHub(event.locals, gitHubUser);
		const cookie = await generateSessionCookie(event.locals, user.id);
		event.cookies.set(cookie.name, cookie.value, { ...cookie.attributes });
	}
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/',
		},
	});
}
