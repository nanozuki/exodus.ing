import { z } from 'zod';
import type { Actions } from './$types';
import { services } from '$lib/server/registry';
import { AppError } from '$lib/errors';
import { fail, redirect } from '@sveltejs/kit';
import { consoleRoutes } from '../routes';

const acceptFormScheme = z.object({
  inviteCode: z.string().min(1, '邀请码不能为空'),
});

export const actions = {
  default: async ({ locals, request }) => {
    const user = locals.requireLoggedInUser('accept invite code');
    const data = await request.formData();
    console.log('accept invite code', data);
    const form = acceptFormScheme.safeParse({ inviteCode: data.get('inviteCode') });
    if (!form.success) {
      return fail(400, {
        inviteCode: data.get('inviteCode')?.toString() || '',
        error: form.error.errors[0].message,
      });
    }
    const { inviteCode } = form.data;

    try {
      await services.inviteCode.acceptInviteCode(user, inviteCode);
    } catch (e) {
      const error = AppError.catch(e);
      return fail(error.code, {
        inviteCode: inviteCode,
        error: error.message,
      });
    }
    redirect(302, `${consoleRoutes.invites.route}?welcome=true`);
  },
} satisfies Actions;
