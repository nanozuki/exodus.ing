import type { Page, Locator } from '@playwright/test';
import { expect } from './fixtures';

/** Asserts a visible H1 with exactly `title` and, when `body` is non-empty, visible article text exactly `body`. */
export async function articleContent(page: Page, title: string, body?: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  if (body) await expect(page.getByRole('article').getByText(body, { exact: true })).toBeVisible();
}

/**
 * Fills the editor with `# title` and `body`, checks the preview's title, `previewBody`, and valid state, publishes,
 * and returns the new article's `/a/<id>` pathname. Pass `previewBody` when the rendered body differs from its source.
 */
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

/** Locates the `comment-<id>` anchor used for links and post-submit navigation. */
export function comment(page: Page, id: string): Locator {
  return page.locator(`[id="comment-${id}"]`);
}

/**
 * Submits `text` as a comment, expects navigation to its `#comment-<id>` fragment, a cleared textbox, and each line
 * visible in the comment, and returns the comment ID.
 */
export async function postComment(page: Page, text: string): Promise<string> {
  await page.getByRole('textbox').fill(text);
  await page.getByRole('button', { name: '发表评论', exact: true }).click();
  await expect(page).toHaveURL(/#comment-[^/]+$/);
  await expect(page.getByRole('textbox')).toHaveValue('');
  const id = new URL(page.url()).hash.replace('#comment-', '');
  for (const line of text.split('\n')) await expect(comment(page, id).getByText(line, { exact: true })).toBeVisible();
  return id;
}

/** Asserts a visible 401 or 403 error heading and no textboxes on a protected destination. */
export async function restricted(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /Error: (401|403)/ })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
}
