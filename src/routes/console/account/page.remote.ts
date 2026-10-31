import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/registry.js';
import { updateUsername as updateUsernameUseCase } from '#lib/server/use-cases/user.js';

const updateUsernameSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
});

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
