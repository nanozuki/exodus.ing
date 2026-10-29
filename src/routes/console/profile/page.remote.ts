import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/registry.js';
import { updateUser } from '#lib/server/repositories/user.js';

const updateProfileSchema = z.object({
  name: z.string().min(1, '名字不能为空'),
  aboutMe: z.string(),
});

export const updateProfile = form(updateProfileSchema, async ({ name, aboutMe }, issue) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('update profile');

  try {
    await updateUser(db, { id: user.id, name, aboutMe });
  } catch (error) {
    if (isHttpError(error) && error.body.tag === 'PARAMETER_INVALID') {
      const fields = error.body.value as Record<string, string>;
      if (fields.name) invalid(issue.name(fields.name));
    }
    throw error;
  }

  redirect(303, '/console/profile');
});
