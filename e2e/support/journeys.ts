import type { Page, Locator } from '@playwright/test';
import { expect } from './fixtures';

/** Assert saved article content at its current address. */
export async function articleContent(page: Page, title: string, body?: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  if (body) await expect(page.getByRole('article').getByText(body, { exact: true })).toBeVisible();
}

/** Fill the Markdown editor, check its preview and publish through the visible form. */
export async function publishMarkdown(page: Page, title: string, body: string, previewBody = body): Promise<string> {
  await page.getByRole('textbox').fill(`# ${title}\n\n${body}`);
  await page.getByRole('button', { name: '预览', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  await expect(page.getByText(previewBody, { exact: true })).toBeVisible();
  await expect(page.getByText('缺少标题', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '发布', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '发布', exact: true }).click();
  await expect(page).toHaveURL(/\/a\/[^/?#]+$/);
  return new URL(page.url()).pathname;
}

/** Find a comment by the fragment used for links and post-submit navigation. */
export function comment(page: Page, id: string): Locator {
  return page.locator(`[id="comment-${id}"]`);
}

/** Submit a comment and return the application-selected comment identifier. */
export async function postComment(page: Page, text: string): Promise<string> {
  await page.getByRole('textbox').fill(text);
  await page.getByRole('button', { name: '发表评论', exact: true }).click();
  await expect(page).toHaveURL(/#comment-[^/]+$/);
  await expect(page.getByRole('textbox')).toHaveValue('');
  const id = new URL(page.url()).hash.replace('#comment-', '');
  for (const line of text.split('\n')) await expect(comment(page, id).getByText(line, { exact: true })).toBeVisible();
  return id;
}

/** Check that a protected destination does not expose its editing controls. */
export async function restricted(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /Error: (401|403)/ })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
}
