import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/registry.js';
import { now } from '#lib/server/adapters/clock.js';
import { acceptInviteCode as acceptInviteCodeUseCase } from '#lib/server/use-cases/invite_code.js';
import { getRolesOfUser } from '#lib/server/repositories/role.js';
import { loadLayoutData } from '../../layout.remote';

export const acceptInviteCode = form(
  z.object({ inviteCode: z.string().min(1, '邀请码不能为空') }),
  async ({ inviteCode }, issue) => {
    const actor = getRequestEvent().locals.requireLoggedInUser('accept invite code');

    try {
      await acceptInviteCodeUseCase({ db, now }, { actor, code: inviteCode });
    } catch (error) {
      if (isHttpError(error) && error.body.detail?.tag === 'PARAMETER_INVALID') {
        const fields = error.body.detail.value;
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
