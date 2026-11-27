import { form, getRequestEvent, query } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/registry.js';
import { getIdentitiesOfUser } from '#lib/server/repositories/user.js';
import { updateUsername as updateUsernameUseCase } from '#lib/server/use-cases/user.js';

/** Requires login and returns the viewer's GitHub ID from their `github` identity, or null when they have none. */
export const loadPageData = query(async (): Promise<{ githubId: string | null }> => {
  const user = getRequestEvent().locals.requireLoggedInUser('settings');
  const identities = await getIdentitiesOfUser(db, user.id);
  return { githubId: identities.find((identity) => identity.provider === 'github')?.subject ?? null };
});

const updateUsernameSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
});

/**
 * Requires login and renames the viewer to the submitted username exactly as given, then redirects 301 to
 * `/u/@<username>`. The use case rejects a leading `@`, treats the current name as a no-op, and leaves duplicates to
 * database uniqueness. Its PARAMETER_INVALID `username` becomes a field issue; other errors propagate.
 */
export const updateUsername = form(updateUsernameSchema, async ({ username }, issue) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('update username');

  try {
    await updateUsernameUseCase({ db }, { actor: user, username });
  } catch (error) {
    if (isHttpError(error) && error.body.detail?.tag === 'PARAMETER_INVALID') {
      const fields = error.body.detail.value;
      if (fields.username) invalid(issue.username(fields.username));
    }
    throw error;
  }

  redirect(301, `/u/@${username}`);
});
