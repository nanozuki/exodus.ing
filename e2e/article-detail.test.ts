import { test, expect } from '@playwright/test';
import { articleSamples } from '../src/lib/testing/data';

test('markdown rendering', async ({ page }) => {
  const { markdownSample } = articleSamples;
  await page.goto(`/a/${markdownSample.id}`);

  const article = page.locator('article');
  const markdown = article.locator('.markdown');

  await expect(article.getByRole('heading', { level: 1, name: 'Markdown Showcase (English)' })).toBeVisible();
  await expect(markdown.getByText('A paragraph with', { exact: false })).toBeVisible();
  await expect(markdown.locator('a[href="https://exodus.ing"]')).toHaveText('Exodus');
  await expect(markdown.locator('hr')).toBeVisible();
  await expect(markdown.getByRole('heading', { level: 2, name: 'Heading 2' })).toBeVisible();
  await expect(markdown.getByRole('heading', { level: 3, name: 'Heading 3' })).toBeVisible();
  await expect(markdown.getByRole('heading', { level: 4, name: 'Heading 4' })).toBeVisible();
  await expect(markdown.getByRole('heading', { level: 5, name: 'Heading 5' })).toBeVisible();
  await expect(markdown.getByRole('heading', { level: 6, name: 'Heading 6' })).toBeVisible();

  await expect(markdown.locator('blockquote').first()).toContainText('A blockquote for emphasis.');
  await expect(markdown.locator('blockquote blockquote blockquote')).toContainText('Another nested blockquote level.');

  await expect(markdown.locator('img[alt="Sample image"]')).toBeVisible();
  await expect(markdown.locator('pre code')).toContainText('const greeting = "Hello, Exodus";');
  await expect(markdown.locator('code')).toContainText('inline code');

  await expect(markdown.locator('ul > li')).toContainText('Unordered item one');
  await expect(markdown.locator('ol > li')).toContainText('Ordered item one');

  await expect(markdown.locator('table')).toBeVisible();
  await expect(markdown.locator('th').first()).toHaveText('Name');
  await expect(markdown.locator('td').first()).toHaveText('Alpha');
});
