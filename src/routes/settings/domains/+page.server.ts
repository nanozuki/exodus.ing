import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.layouts.requireLoggedInUser('domain settings');
  const domains = await locals.settingsPage.listUserDomains(user.id);
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
    const user = locals.layouts.requireLoggedInUser('domain settings');
    await locals.settingsPage.addUserDomain(user.id, domain);
  },
} satisfies Actions;
