import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/registry';
import { updateUsername as updateUsernameUseCase } from '$lib/server/use-cases/user';

const updateUsernameSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
});

export const updateUsername = form(updateUsernameSchema, async ({ username }) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('update username');
  await updateUsernameUseCase({ db }, { actor: user, username });
  redirect(301, `/u/@${username}`);
});
