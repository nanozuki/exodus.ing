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

export const createInviteCode = form(async () => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'create invite code');
  await createInviteCodeUseCase({ db }, { actor: loggedInUser });
  loadPageData({}).refresh();
});

const deleteInviteCodeSchema = z.object({
  code: z.string().min(1, '邀请码不能为空'),
});

export const deleteInviteCode = form(deleteInviteCodeSchema, async ({ code }) => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'delete invite code');
  await deleteInviteCodeRepository(db, { inviterId: loggedInUser.id, code });
  loadPageData({}).refresh();
});
