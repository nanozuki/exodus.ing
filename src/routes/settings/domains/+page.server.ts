import { createUserDomain, getUserDomains } from '$lib/server/user_domain';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const domains = await getUserDomains(locals, locals.loggedInUser!.id);
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
    await createUserDomain(locals, locals.loggedInUser!.id, domain);
  },
} satisfies Actions;
