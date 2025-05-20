import { Role } from '$lib/domain/entities/role';
import { services } from '$lib/server/registry';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.requireLoggedInUser('invite code');
  return await services.inviteCode.getUserInvitationData(user);
};

const deleteFormScheme = z.object({
  code: z.string().min(1, '邀请码不能为空'),
});

export const actions = {
  create: async ({ locals }) => {
    const user = locals.requireLoggedInUser('invite code');
    await services.inviteCode.createInviteCode(user.id, Role.ArticleAuthor);
  },
  delete: async ({ locals, request }) => {
    const user = locals.requireLoggedInUser('invite code');
    const data = await request.formData();
    const form = deleteFormScheme.parse({
      code: data.get('code'),
    });
    await services.inviteCode.deleteInviteCode(user, form.code);
  },
} satisfies Actions;
