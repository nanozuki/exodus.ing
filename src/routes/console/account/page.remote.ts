import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/registry';
import { updateUsername as updateUsernameUseCase } from '$lib/server/use-cases/user';

const updateUsernameSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
});

export const updateUsername = form(updateUsernameSchema, async ({ username }, issue) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('update username');

  try {
    await updateUsernameUseCase({ db }, { actor: user, username });
  } catch (error) {
    if (isHttpError(error) && error.body.tag === 'PARAMETER_INVALID') {
      const fields = error.body.value as Record<string, string>;
      if (fields.username) invalid(issue.username(fields.username));
    }
    throw error;
  }

  redirect(301, `/u/@${username}`);
});
