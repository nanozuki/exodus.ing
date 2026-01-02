import { Permission, Role } from '$lib/domain/entities/role';
import { services } from '$lib/server/registry';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const loggedInUser = locals.requireLoggedInUser('invite code');
  const welcome = url.searchParams.get('welcome') === 'true';
  const data = await services.inviteCode.getUserInvitationData(loggedInUser.id);
  return { ...data, welcome };
};

const deleteFormScheme = z.object({
  code: z.string().min(1, '邀请码不能为空'),
});

export const actions = {
  create: async ({ locals }) => {
    const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'create invite code');
    await services.inviteCode.createInviteCode(loggedInUser.id, Role.ArticleAuthor);
  },
  delete: async ({ locals, request }) => {
    const loggedInUser = locals.requirePermission(Permission.CreateArticle, 'delete invite code');
    const data = await request.formData();
    const form = deleteFormScheme.parse({
      code: data.get('code'),
    });
    await services.inviteCode.deleteInviteCode(loggedInUser.id, form.code);
  },
} satisfies Actions;
