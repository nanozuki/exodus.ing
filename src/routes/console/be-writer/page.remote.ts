import { form, getRequestEvent } from '$app/server';
import z from 'zod';
import { invalid, isHttpError, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/registry.js';
import { clock } from '#lib/server/adapters/clock.js';
import { acceptInviteCode as acceptInviteCodeUseCase } from '#lib/server/use-cases/invite_code.js';
import { getRolesOfUser } from '#lib/server/repositories/role.js';
import { loadLayoutData } from '../../layout.remote';

/**
 * Requires login and redeems the invite code for the viewer; the code is consumed and its role granted atomically, so
 * a code cannot be redeemed twice. On success it sets the root layout query to the viewer with reloaded roles and
 * redirects 302 to `/console/invites?welcome=true`. PARAMETER_INVALID `inviteCode` becomes a field issue; other errors
 * propagate.
 */
export const acceptInviteCode = form(
  z.object({ inviteCode: z.string().min(1, '邀请码不能为空') }),
  async ({ inviteCode }, issue) => {
    const actor = getRequestEvent().locals.requireLoggedInUser('accept invite code');

    try {
      await acceptInviteCodeUseCase({ db, clock }, { actor, code: inviteCode });
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
