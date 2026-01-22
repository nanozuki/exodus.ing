import { test, expect, Page } from '@playwright/test';
import { ArticleSeed, getAuthor, testDataset } from '../src/lib/testing/data';

async function checkAricleItem(page: Page, article: ArticleSeed) {
  const author = getAuthor(article);
  const articleItem = page.locator('article', {
    has: page.getByRole('heading', { level: 2, name: article.title }),
  });
  if (article.contentType === 'external') {
    await expect(articleItem.locator(`a[href="${article.content}"]`)).toBeVisible();
  }
  await expect(articleItem.locator(`a[href="/u/@${author.username}"]`)).toBeVisible();
  await expect(articleItem.locator('span')).toContainText('2026-01-01');

  const metaNumbers: string[] = [article.replyCount, article.commentCount, article.bookmarkCount]
    .filter((n) => n > 0)
    .map(String);
  const mataItems = articleItem.locator('div.gap-x-2xs > div');
  await expect(mataItems).toHaveCount(metaNumbers.length + 1);
  for (let i = 0; i < metaNumbers.length; i++) {
    await expect(mataItems.nth(i + 1)).toContainText(metaNumbers[i]);
  }
}

test('test', async ({ page }) => {
  await page.goto('/');

  const { articles } = testDataset;
  const articleItems = page.locator('article');

  const markdownSample = articles[20];
  await expect(articleItems).toHaveCount(20);

  await checkAricleItem(page, markdownSample);

  await page.locator('nav').getByRole('button', { name: '2' }).click();
  await expect(page).toHaveURL('/?page=2');
  await expect(articleItems).toHaveCount(articles.length - 20);

  const externalSample = articles[0];
  await checkAricleItem(page, externalSample);
});
