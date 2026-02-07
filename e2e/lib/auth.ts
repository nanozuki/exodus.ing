import { Page } from '@playwright/test';

export async function signIn(page: Page, username: string) {
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
