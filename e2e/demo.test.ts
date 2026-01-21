import { expect, test } from '@playwright/test';
import { testDataset } from '../src/lib/testing/data';

test('home page paginates article list', async ({ page }) => {
  await page.goto('/');

  const { articles } = testDataset;

  const articleItems = page.locator('article');
  const newestTitle = articles[articles.length - 1].title;
  const nextPageTitle = articles[articles.length - 21].title;
  const oldestTitle = articles[0].title;
  const showcaseHeading = 'Showcase: ' + articles[articles.length - 1].title;

  await expect(articleItems).toHaveCount(20);
  await expect(articleItems.first().locator('h2')).toHaveText(newestTitle);

  await page.getByRole('link', { name: newestTitle }).click();
  await expect(page.getByRole('heading', { level: 1, name: showcaseHeading })).toBeVisible();
  await page.goBack();

  await page.getByRole('button', { name: '2' }).click();
  await expect(page).toHaveURL('/?page=2');
  await expect(articleItems).toHaveCount(6);
  await expect(articleItems.first().locator('h2')).toHaveText(nextPageTitle);
  await expect(articleItems.last().locator('h2')).toContainText(oldestTitle);
});
