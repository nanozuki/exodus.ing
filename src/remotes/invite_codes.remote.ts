import { form, getRequestEvent, query } from '$app/server';
import { inviteCodeQuota } from '$lib/domain/entities/invite_code';
import { Permission, Role } from '$lib/domain/entities/role';
import { throwError } from '$lib/errors';
import { repositories } from '$lib/server/registry';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

export const getConsoleInviteData = query(z.object({}), async () => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'invite code');
  const [inviter, invitees, unusedCodes, quota] = await Promise.all([
    repositories.role.getInviter(loggedInUser.id),
    repositories.role.getInvitees(loggedInUser.id),
    repositories.inviteCode.getUserUnusedCodes(loggedInUser.id),
    repositories.inviteCode.getUserInviteQuota(loggedInUser.id, inviteCodeQuota),
  ]);
  return { inviter, invitees, unusedCodes, quota };
});

const acceptInviteCodeSchema = z.object({
  inviteCode: z.string().min(1, '邀请码不能为空'),
});

export const acceptInviteCode = form(acceptInviteCodeSchema, async ({ inviteCode }) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('accept invite code');
  const inviteCodeRecord = await repositories.inviteCode.findByCode(inviteCode);
  if (!inviteCodeRecord) {
    return throwError('BAD_REQUEST', '邀请码不能为空');
  }
  if (inviteCodeRecord.usedAt) {
    return throwError('BAD_REQUEST', '邀请码已被使用');
  }
  await repositories.inviteCode.useCode(inviteCode);
  await repositories.role.specifyRoleByOther(user.id, inviteCodeRecord.roleKey as Role, inviteCodeRecord.inviterId);
  redirect(302, '/console/invites?welcome=true');
});

export const createInviteCode = form(async () => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'create invite code');
  await repositories.inviteCode.create({ inviterId: loggedInUser.id, roleKey: Role.ArticleAuthor }, inviteCodeQuota);
  getConsoleInviteData({}).refresh();
});

const deleteInviteCodeSchema = z.object({
  code: z.string().min(1, '邀请码不能为空'),
});

export const deleteInviteCode = form(deleteInviteCodeSchema, async ({ code }) => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'delete invite code');
  await repositories.inviteCode.delete(loggedInUser.id, code);
  getConsoleInviteData({}).refresh();
});
