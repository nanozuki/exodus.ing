import { Permission } from '$lib/domain/entities/role';
import { services } from '$lib/server/registry';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = await locals.requirePermission(Permission.CreateArticle, 'domain settings');
  const domains = await services.userDomain.listUserDomains(user.id);
  return {
    domains,
  };
};

export const actions = {
  default: async ({ locals, request }) => {
    const data = await request.formData();
    const domain = data.get('domain');
    if (typeof domain !== 'string') {
      return { error: '域名不能为空' };
    }
    const user = await locals.requirePermission(Permission.CreateArticle, 'create domain');
    await services.userDomain.createUserDomain(user.id, domain);
  },
} satisfies Actions;
