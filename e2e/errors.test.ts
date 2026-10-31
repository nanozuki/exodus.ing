import { test, expect } from './support/fixtures';

test('Framework and business errors retain readable error pages', async ({ page }) => {
  await test.step('Display a framework 404 without business details', async () => {
    const response = await page.goto('/missing-route-for-error-test');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Error: 404', exact: true })).toBeVisible();
    await expect(page.getByText('未找到', { exact: true })).toBeVisible();
    await expect(page.locator('small')).not.toBeEmpty();
  });

  await test.step('Display business details from a failed remote query', async () => {
    const response = await page.goto('/a/absent');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Error: 404', exact: true })).toBeVisible();
    await expect(page.getByText('未找到', { exact: true })).toBeVisible();
    await expect(page.locator('small')).toContainText('不存在');
  });
});
