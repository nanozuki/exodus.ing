import { test, expect, Page } from '@playwright/test';
import { articleSamples, ArticleSeed, getAuthor, testDataset } from '../src/lib/testing/data';

async function checkArticleItem(page: Page, article: ArticleSeed) {
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
    .filter((n) => n && n > 0)
    .map(String);
  const metaItems = articleItem.locator('div.gap-x-2xs > div');
  await expect(metaItems).toHaveCount(metaNumbers.length + 1);
  for (let i = 0; i < metaNumbers.length; i++) {
    await expect(metaItems.nth(i + 1)).toContainText(metaNumbers[i]);
  }
}

test('homepage', async ({ page }) => {
  await page.goto('/');

  const { articles } = testDataset;
  const articleItems = page.locator('article');

  await expect(articleItems).toHaveCount(20);

  const { interactiveSample, externalSample } = articleSamples;
  await checkArticleItem(page, interactiveSample);

  await page.locator('nav').getByRole('link', { name: '2' }).click();
  await expect(page).toHaveURL('/?page=2');
  await expect(articleItems).toHaveCount(articles.length - 20);

  await checkArticleItem(page, externalSample);
});
