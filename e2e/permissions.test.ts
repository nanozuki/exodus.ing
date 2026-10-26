import { test, expect } from './support/fixtures';
import { articleContent, restricted } from './support/journeys';

test('Visitor receives authentication guidance for protected actions', async ({ page }) => {
  await page.goto('/a/A25');
  await page.getByRole('button', { name: '收藏 3', exact: true }).first().click();
  await expect(page).toHaveURL((url) => url.pathname === '/auth' && url.searchParams.get('next') === '/a/A25');
  await page.goto('/a/A25');
  await page.locator('#comment-section').getByRole('link', { name: '登录/注册', exact: true }).click();
  await expect(page).toHaveURL(
    (url) => url.pathname === '/auth' && url.searchParams.get('next') === '/a/A25#comment-section',
  );
  for (const path of ['/console/account', '/a/new/edit']) {
    await page.goto(path);
    await restricted(page);
  }
  await page.goto('/auth');
  await expect(page.getByText('注册', { exact: true })).toBeVisible();
  await expect(page.getByText('登录', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '使用 GitHub 注册', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '使用 GitHub 登录', exact: true })).toBeVisible();
});

test("Reader and author cannot edit another author's article", async ({ actor, db }) => {
  const reader = await actor('carol');
  const author = await actor('bob');
  const original = (await db.query('SELECT title, content FROM article WHERE id = $1', ['A25'])).rows[0];
  await test.step('A reader cannot enter author operations', async () => {
    await reader.goto('/a/A25');
    await expect(reader.getByRole('link', { name: '编辑', exact: true })).toHaveCount(0);
    await expect(reader.locator('#reply-section').getByRole('link', { name: '回应', exact: true })).toHaveCount(0);
    await reader.goto('/a/new/edit');
    await restricted(reader);
    await reader.goto('/console/invites');
    // The console may restrict access by returning the reader to a permitted settings page.
    await expect(reader).toHaveURL('/console/profile');
    await expect(reader.getByRole('button', { name: /^创建邀请码/ })).toHaveCount(0);
    await expect(reader.getByRole('link', { name: '邀请', exact: true })).toHaveCount(0);
  });
  await test.step('Another author cannot open the original article editor', async () => {
    await author.goto('/a/A25');
    await expect(author.getByRole('link', { name: '编辑', exact: true })).toHaveCount(0);
    await author.goto('/a/A25/edit');
    await restricted(author);
    expect((await db.query('SELECT title, content FROM article WHERE id = $1', ['A25'])).rows[0]).toEqual(original);
    await reader.goto('/a/A25');
    await reader.reload();
    await articleContent(reader, original.title);
  });
});

test('User signs out and loses authenticated access', async ({ actor }) => {
  const page = await actor('alice');
  await page.goto('/console/account');
  await expect(page.getByText('alice', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Alice', exact: true })).toHaveAttribute('href', '/u/@alice');
  await expect(page.getByRole('link', { name: '邀请', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Alice', exact: true }).click();
  await page.getByRole('button', { name: '登出', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: '注册/登录', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: '注册/登录', exact: true })).toBeVisible();
  await page.goto('/console/account');
  await restricted(page);
  await page.goto('/a/A25');
  await expect(page.getByText('登录后方可评论', { exact: true })).toBeVisible();
  await expect(page.locator('#comment-section').getByRole('link', { name: '登录/注册', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
});
