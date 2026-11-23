import { form, getRequestEvent, query } from '$app/server';
import { getInviteQuota, createInviteCode as createInviteCodeUseCase } from '#lib/server/use-cases/invite_code.js';
import { findInviterOfUser, getInviteesOfUser } from '#lib/server/repositories/role.js';
import {
  getUnusedInviteCodesOfUser,
  deleteInviteCode as deleteInviteCodeRepository,
} from '#lib/server/repositories/invite_code.js';
import { Permission } from '#lib/models/role.js';
import { db } from '#lib/server/registry.js';
import z from 'zod';

/**
 * Requires `CreateArticle` and returns the viewer's inviter (undefined when invited directly by the site), invitees,
 * unused codes, and remaining quota. The sections are read concurrently and need not reflect one snapshot.
 */
export const loadPageData = query(z.object({}), async () => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'invite code');
  const [inviter, invitees, unusedCodes, quota] = await Promise.all([
    findInviterOfUser(db, loggedInUser.id),
    getInviteesOfUser(db, loggedInUser.id),
    getUnusedInviteCodesOfUser(db, loggedInUser.id),
    getInviteQuota({ db }, { userId: loggedInUser.id }),
  ]);
  return { inviter: inviter ?? undefined, invitees, unusedCodes, quota };
});

/**
 * Requires `CreateArticle`, creates an invite code within the viewer's quota, and refreshes the page data. A used-up
 * quota throws BAD_REQUEST; a concurrent creation throws BAD_REQUEST or DATABASE_ERROR, as `createInviteCode` in
 * the use cases describes.
 */
export const createInviteCode = form(async () => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'create invite code');
  await createInviteCodeUseCase({ db }, { actor: loggedInUser });
  loadPageData({}).refresh();
});

const deleteInviteCodeSchema = z.object({
  code: z.string().min(1, '邀请码不能为空'),
});

/** Requires `CreateArticle`, deletes the viewer's own `code` (a missing one is a no-op), and refreshes the data. */
export const deleteInviteCode = form(deleteInviteCodeSchema, async ({ code }) => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'delete invite code');
  await deleteInviteCodeRepository(db, { inviterId: loggedInUser.id, code });
  loadPageData({}).refresh();
});
