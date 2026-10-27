import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/registry';
import { now } from '$lib/server/adapters/clock';
import { acceptInviteCode as acceptInviteCodeUseCase } from '$lib/server/use-cases/invite_code';

export const acceptInviteCode = form(
  z.object({ inviteCode: z.string().min(1, '邀请码不能为空') }),
  async ({ inviteCode }) => {
    const actor = getRequestEvent().locals.requireLoggedInUser('accept invite code');
    await acceptInviteCodeUseCase({ db, now }, { actor, code: inviteCode });
    redirect(302, '/console/invites?welcome=true');
  },
);
