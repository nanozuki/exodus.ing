import { test, expect } from './support/fixtures';

const identityOwner = 'SELECT u.username FROM user_identity i JOIN "user" u ON u.id = i.user_id WHERE i.subject = $1';

/**
 * A visitor arrives from GitHub with an identity that has no account yet, holding a pending sign-up that asked to
 * return to account settings. They first pick a username someone else holds, correct it, and land in account settings
 * signed in as the new account. The spent pending sign-up then leads only back to the authentication page.
 */
test('Visitor with a new identity corrects a taken username and signs up', async ({ pendingSignUp, db }) => {
  const page = await pendingSignUp({
    subject: '7001',
    username: 'octo-newcomer',
    name: 'Octo Newcomer',
    next: '/console/account',
  });
  await test.step('The form starts from the provider suggestions', async () => {
    await page.goto('/auth/sign-up');
    await expect(page.locator('input[name^="username/"]')).toHaveValue('octo-newcomer');
    await expect(page.locator('input[name^="name/"]')).toHaveValue('Octo Newcomer');
  });
  await test.step('A taken username is reported on its field', async () => {
    await page.locator('input[name^="username/"]').fill('alice');
    await page.getByRole('button', { name: '注册', exact: true }).click();
    await expect(page.locator('input[name^="username/"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('用户名已存在', { exact: true })).toBeVisible();
    await expect(page.locator('input[name^="username/"]')).toHaveValue('alice');
    await expect(page.locator('input[name^="name/"]')).toHaveValue('Octo Newcomer');
    expect((await db.query(identityOwner, ['7001'])).rows).toEqual([]);
  });
  await test.step('An available username creates the account and returns to the destination', async () => {
    await page.locator('input[name^="username/"]').fill('octo-joined');
    await page.getByRole('button', { name: '注册', exact: true }).click();
    await expect(page).toHaveURL('/console/account');
    await expect(page.getByText('octo-joined', { exact: true })).toBeVisible();
    await expect(page.getByText('7001', { exact: true })).toBeVisible();
    expect((await db.query(identityOwner, ['7001'])).rows).toEqual([{ username: 'octo-joined' }]);
  });
  await test.step('The spent pending sign-up leads back to authentication', async () => {
    await page.goto('/auth/sign-up');
    await expect(page).toHaveURL('/auth');
  });
});

/**
 * A visitor holding a pending sign-up for a new identity cancels it on the sign-up page. They return to the
 * authentication page without an account, and the pending sign-up cannot be resumed.
 */
test('Visitor cancels a pending sign-up', async ({ pendingSignUp, db }) => {
  const page = await pendingSignUp({ subject: '7002', username: 'octo-leaving' });
  await page.goto('/auth/sign-up');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page).toHaveURL('/auth');
  expect((await db.query(identityOwner, ['7002'])).rows).toEqual([]);
  await page.goto('/auth/sign-up');
  await expect(page).toHaveURL('/auth');
});
