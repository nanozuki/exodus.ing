import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/registry';
import { now } from '$lib/server/adapters/clock';
import { acceptInviteCode as acceptInviteCodeUseCase } from '$lib/server/use-cases/invite_code';
import { getRolesOfUser } from '$lib/server/repositories/role';
import { loadLayoutData } from '../../layout.remote';

export const acceptInviteCode = form(
  z.object({ inviteCode: z.string().min(1, '邀请码不能为空') }),
  async ({ inviteCode }, issue) => {
    const actor = getRequestEvent().locals.requireLoggedInUser('accept invite code');

    try {
      await acceptInviteCodeUseCase({ db, now }, { actor, code: inviteCode });
    } catch (error) {
      if (isHttpError(error) && error.body.tag === 'PARAMETER_INVALID') {
        const fields = error.body.value as Record<string, string>;
        if (fields.inviteCode) invalid(issue.inviteCode(fields.inviteCode));
      }
      throw error;
    }

    // Update the viewer explicitly: globally refreshing the old reader-only route
    // after granting author access can redirect away from the intended destination.
    const roles = await getRolesOfUser(db, actor.id);
    loadLayoutData().set({ user: { ...actor, roles } });
    redirect(302, '/console/invites?welcome=true');
  },
);
