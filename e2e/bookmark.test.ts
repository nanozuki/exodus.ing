import { expect, test } from '@playwright/test';
import { articleSamples } from '../src/lib/testing/data';
import { signIn } from './lib/auth';
import { useTestDatabase } from './lib/database';

const database = 'exodus-bookmark-test';

test('bookmark button', async ({ page }) => {
  useTestDatabase(database);

  const { interactiveSample, externalSample } = articleSamples;

  // Sign in as frank (reader3) who not bookmarked test articles yet
  await signIn(page, 'frank');

  // Test markdown article (has two bookmark buttons: one in Title, one after article)
  await page.goto(`/a/${interactiveSample.id}`);

  // Verify there are two bookmark buttons for markdown article
  const bookmarkButtons = page.getByRole('button', { name: /收藏/ });
  await expect(bookmarkButtons).toHaveCount(2);
  await expect(bookmarkButtons.filter({ hasText: '已收藏' })).toHaveCount(0);

  // Get the first bookmark button (in Title)
  const topBookmarkButton = bookmarkButtons.first();

  // Click to bookmark
  await topBookmarkButton.click();

  // Wait for state change and verify both buttons show bookmarked state
  await expect(bookmarkButtons.filter({ hasText: '已收藏' })).toHaveCount(2);

  // Click again to unbookmark
  await topBookmarkButton.click();

  // Verify both buttons return to unbookmarked state
  await expect(bookmarkButtons.filter({ hasText: '已收藏' })).toHaveCount(0);

  // Test external article (has only one bookmark button in Title)
  await page.goto(`/a/${externalSample.id}`);

  // Verify there is only one bookmark button for external article
  const externalBookmarkButtons = page.getByRole('button', { name: /收藏/ });
  await expect(externalBookmarkButtons).toHaveCount(1);
  await expect(externalBookmarkButtons.filter({ hasText: '已收藏' })).toHaveCount(0);

  // Test bookmark toggle on external article
  const externalBookmarkButton = externalBookmarkButtons.first();

  await externalBookmarkButton.click();
  await expect(externalBookmarkButtons.filter({ hasText: '已收藏' })).toHaveCount(1);

  await externalBookmarkButton.click();
  await expect(externalBookmarkButtons.filter({ hasText: '已收藏' })).toHaveCount(0);
});
