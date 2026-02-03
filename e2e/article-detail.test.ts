import { test, expect, Page } from '@playwright/test';
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
  await expect(markdown.locator('p code')).toContainText('inline code');
  await expect(markdown.locator('pre code')).toContainText('const greeting = "Hello, Exodus";');

  await expect(markdown.locator('ul > li').first()).toContainText('Unordered item one');
  await expect(markdown.locator('ol > li').first()).toContainText('Ordered item one');

  await expect(markdown.locator('table')).toBeVisible();
  await expect(markdown.locator('th').first()).toHaveText('Name');
  await expect(markdown.locator('td').first()).toHaveText('Alpha');
});

test('external article rendering', async ({ page }) => {
  const { externalSample } = articleSamples;
  await page.goto(`/a/${externalSample.id}`);

  const article = page.locator('article');

  // Check title is displayed
  await expect(article.getByRole('heading', { level: 1, name: externalSample.title })).toBeVisible();

  // Check external article message
  await expect(article.getByText('此文章发表于站外')).toBeVisible();

  // Check external link
  const externalLink = article.getByRole('link', { name: /阅读原文/ });
  await expect(externalLink).toBeVisible();
  await expect(externalLink).toHaveAttribute('href', externalSample.content as string);
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
});

async function signIn(page: Page, username: string) {
  // Navigate to auth page and click '模拟登录' button
  await page.goto('/auth');
  await page.getByRole('link', { name: '模拟登录' }).click();

  // Wait for navigation to testing login page
  await page.waitForURL('/auth/testing**');

  // Click the button containing the username
  await page.getByRole('button', { name: new RegExp(`@${username}`) }).click();

  // Wait for navigation after login (redirects to home by default)
  await page.waitForURL('/');
}

test('bookmark button', async ({ page }) => {
  const { interactiveSample, externalSample } = articleSamples;

  // Sign in as frank (reader3) who not bookmarked test articles yet
  await signIn(page, 'frank');

  // Test markdown article (has two bookmark buttons: one in Title, one after article)
  await page.goto(`/a/${interactiveSample.id}`);

  // Verify there are two bookmark buttons for markdown article
  const bookmarkButtons = page.getByRole('button', { name: /收藏/ });
  await expect(bookmarkButtons).toHaveCount(2);

  // Get the first bookmark button (in Title) and verify initial state
  const topBookmarkButton = bookmarkButtons.first();
  await expect(topBookmarkButton).toContainText('收藏');
  await expect(topBookmarkButton).not.toContainText('已收藏');

  // Click to bookmark
  await topBookmarkButton.click();

  // Wait for state change and verify both buttons show bookmarked state
  await expect(topBookmarkButton).toContainText('已收藏');
  const bottomBookmarkButton = bookmarkButtons.last();
  await expect(bottomBookmarkButton).toContainText('已收藏');

  // Click again to unbookmark
  await topBookmarkButton.click();

  // Verify both buttons return to unbookmarked state
  await expect(topBookmarkButton).not.toContainText('已收藏');
  await expect(topBookmarkButton).toContainText('收藏');
  await expect(bottomBookmarkButton).not.toContainText('已收藏');
  await expect(bottomBookmarkButton).toContainText('收藏');

  // Test external article (has only one bookmark button in Title)
  await page.goto(`/a/${externalSample.id}`);

  // Verify there is only one bookmark button for external article
  const externalBookmarkButtons = page.getByRole('button', { name: /收藏/ });
  await expect(externalBookmarkButtons).toHaveCount(1);

  // Test bookmark toggle on external article
  const externalBookmarkButton = externalBookmarkButtons.first();
  await expect(externalBookmarkButton).toContainText('收藏');
  await expect(externalBookmarkButton).not.toContainText('已收藏');

  await externalBookmarkButton.click();
  await expect(externalBookmarkButton).toContainText('已收藏');

  await externalBookmarkButton.click();
  await expect(externalBookmarkButton).not.toContainText('已收藏');
  await expect(externalBookmarkButton).toContainText('收藏');
});
