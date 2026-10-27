import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/registry';
import { updateUser } from '$lib/server/repositories/user';

const updateProfileSchema = z.object({
  name: z.string().min(1, '名字不能为空'),
  aboutMe: z.string(),
});

export const updateProfile = form(updateProfileSchema, async ({ name, aboutMe }) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('update profile');
  await updateUser(db, { id: user.id, name, aboutMe });
  redirect(303, '/console/profile');
});
