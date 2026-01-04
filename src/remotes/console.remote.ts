import { form, getRequestEvent, query } from '$app/server';
import { ARTICLE_PAGE_SIZE } from '$lib/domain/entities/article';
import { inviteCodeQuota } from '$lib/domain/entities/invite_code';
import { Permission, Role } from '$lib/domain/entities/role';
import { throwError } from '$lib/errors';
import { repositories } from '$lib/server/registry';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

export const getConsoleBookmarks = query(z.number().min(1), async (page) => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requireLoggedInUser('console bookmarks');
  return await repositories.article.listUserBookmarks(loggedInUser.id, {
    pageNumber: page,
    pageSize: ARTICLE_PAGE_SIZE,
  });
});

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

const updateProfileSchema = z.object({
  name: z.string().min(1, '名字不能为空'),
  aboutMe: z.string(),
});

export const updateProfile = form(updateProfileSchema, async ({ name, aboutMe }) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('update profile');
  await repositories.user.update(user.id, { name, aboutMe });
  redirect(303, '/console/profile');
});

const updateUsernameSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
});

export const updateUsername = form(updateUsernameSchema, async ({ username }) => {
  const { locals } = getRequestEvent();
  const user = locals.requireLoggedInUser('update username');
  if (username === user.username) {
    return { username };
  }
  await repositories.user.update(user.id, { username });
  redirect(301, `/u/@${username}`);
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
