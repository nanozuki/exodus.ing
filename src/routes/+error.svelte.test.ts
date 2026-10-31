import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const state = vi.hoisted(() => ({ page: { status: 500, error: null as App.Error | null } }));

vi.mock('$app/state', () => ({ page: state.page }));

import ErrorPage from './+error.svelte';

const cases: { error: App.Error; title: string }[] = [
  {
    error: {
      status: 403,
      message: '没有权限，不能编辑文章',
      detail: { tag: 'FORBIDDEN', value: { operation: '编辑文章' } },
    },
    title: '没有权限',
  },
  { error: { status: 404, message: 'Not Found' }, title: '未找到' },
  { error: { status: 500, message: 'Internal Error' }, title: '服务器错误' },
  { error: { status: 405, message: 'Method Not Allowed' }, title: '请求错误' },
];

it.each(cases)('renders a readable title for $error.status ($title)', async ({ error, title }) => {
  state.page.status = error.status;
  state.page.error = error;
  const screen = await render(ErrorPage);

  await expect.element(screen.getByRole('heading', { name: `Error: ${error.status}` })).toBeVisible();
  await expect.element(screen.getByText(title, { exact: true })).toBeVisible();
  await expect.element(screen.getByText(error.message, { exact: true })).toBeVisible();
});
