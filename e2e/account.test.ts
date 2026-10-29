import { test, expect } from './support/fixtures';

test('User updates profile and account identity', async ({ actor }) => {
  const page = await actor('carol');
  await test.step('Save a display name and Markdown biography', async () => {
    await page.goto('/console/profile');
    await page.locator('input[name="name"]').fill('Carol Updated');
    await page.locator('textarea[name="aboutMe"]').fill('A **reader** biography with [Exodus](https://exodus.ing).');
    await page.getByRole('button', { name: '更新', exact: true }).click();
    await expect(page.locator('input[name="name"]')).toHaveValue('Carol Updated');
    await expect(page.getByRole('link', { name: 'Carol Updated', exact: true })).toBeVisible();
    await page.goto('/u/@carol');
    await expect(page.getByRole('heading', { name: 'Carol Updated', exact: true })).toBeVisible();
    await expect(page.getByRole('article').getByRole('link', { name: 'Exodus', exact: true })).toHaveAttribute(
      'href',
      'https://exodus.ing',
    );
    await expect(page.getByRole('article').getByRole('strong')).toHaveText('reader');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Carol Updated', exact: true })).toBeVisible();
    await expect(page.getByRole('article').getByText('A reader biography with Exodus.', { exact: true })).toBeVisible();
  });
  await test.step('Cancel a username change', async () => {
    await page.goto('/console/account');
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    await page.locator('input[name="username"]').fill('discarded-carol');
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await expect(page.locator('input[name="username"]')).toBeHidden();
    await expect(page.getByRole('button', { name: '编辑', exact: true })).toBeFocused();
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    await expect(page.locator('input[name="username"]')).toHaveValue('carol');
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await expect(page.getByText('carol', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('carol', { exact: true })).toBeVisible();
  });
  await test.step('Dismiss username editing with Escape and an outside click', async () => {
    const trigger = page.getByRole('button', { name: '编辑', exact: true });
    const username = page.locator('input[name="username"]');
    await trigger.click();
    await expect(username).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(username).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(username).toBeVisible();
    await page.getByRole('dialog', { name: '修改用户名' }).click({ position: { x: -10, y: -10 } });
    await expect(username).toBeHidden();
    await expect(trigger).toBeFocused();
  });
  await test.step('Save an available username and follow the new profile address', async () => {
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    await page.locator('input[name="username"]').fill('carol-updated');
    await page.getByRole('button', { name: '提交', exact: true }).click();
    await expect(page).toHaveURL('/u/@carol-updated');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Carol Updated', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Carol Updated', exact: true })).toHaveAttribute(
      'href',
      '/u/@carol-updated',
    );
    await page.goto('/console/account');
    await expect(page.getByText('carol-updated', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Carol Updated', exact: true })).toHaveAttribute(
      'href',
      '/u/@carol-updated',
    );
  });
});

test('User corrects invalid profile and account input', async ({ actor, db }) => {
  const page = await actor('carol');
  await test.step('Correct an empty required display name', async () => {
    await page.goto('/console/profile');
    const name = page.locator('input[name="name"]');
    await name.fill('');
    await page.getByRole('button', { name: '更新', exact: true }).click();
    await expect.poll(() => name.evaluate((input) => (input as HTMLInputElement).validity.valueMissing)).toBe(true);
    expect((await db.query('SELECT name FROM "user" WHERE username = $1', ['carol'])).rows[0].name).toBe('Carol');
    await page.reload();
    await expect(name).toHaveValue('Carol');
    await name.fill('Carol Valid');
    await page.getByRole('button', { name: '更新', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Carol Valid', exact: true })).toBeVisible();
    await page.reload();
    await expect(name).toHaveValue('Carol Valid');
  });
  await test.step('Correct a username beginning with @', async () => {
    await page.goto('/console/account');
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    await page.locator('input[name="username"]').fill('@invalid-carol');
    await page.getByRole('button', { name: '提交', exact: true }).click();
    await expect(page.getByText('用户名不能以 @ 开头', { exact: false })).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toHaveValue('@invalid-carol');
    expect((await db.query('SELECT username FROM "user" WHERE id = $1', ['user_reader_1'])).rows[0].username).toBe(
      'carol',
    );
    await page.locator('input[name="username"]').fill('carol-valid');
    await page.getByRole('button', { name: '提交', exact: true }).click();
    await expect(page).toHaveURL('/u/@carol-valid');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Carol Valid', exact: true })).toBeVisible();
    await page.goto('/console/account');
    await expect(page.getByText('carol-valid', { exact: true })).toBeVisible();
  });
});

test('Author manages invitations and invites a new author', async ({ actor, db }) => {
  const author = await actor('alice');
  const reader = await actor('carol');
  let code: string;
  await test.step('Create and delete an invitation, restoring quota', async () => {
    await author.goto('/console/invites');
    await expect(author.getByRole('button', { name: '创建邀请码(11)', exact: true })).toBeVisible();
    await author.getByRole('button', { name: '创建邀请码(11)', exact: true }).click();
    await expect(author.getByRole('button', { name: '创建邀请码(10)', exact: true })).toBeVisible();
    // The delete controls have no text; scope the button through its submitted invitation code.
    const created = (
      await db.query('SELECT code FROM invite_code WHERE inviter_id = $1 AND code != $2 AND used_at IS NULL', [
        'user_author_1',
        'INVITE_AUTHOR1_UNUSED',
      ])
    ).rows;
    expect(created).toHaveLength(1);
    code = created[0].code;
    await expect(author.getByText(code, { exact: true })).toBeVisible();
    await author
      .locator('form')
      .filter({ has: author.locator(`input[name="code"][value="${code}"]`) })
      .getByRole('button')
      .click();
    await expect(author.getByText(code, { exact: true })).toHaveCount(0);
    await expect(author.getByRole('button', { name: '创建邀请码(11)', exact: true })).toBeVisible();
    await author.reload();
    await expect(author.getByText(code, { exact: true })).toHaveCount(0);
    await expect(author.getByRole('button', { name: '创建邀请码(11)', exact: true })).toBeVisible();
  });
  await test.step('Create another invitation and redeem it in a separate context', async () => {
    await author.getByRole('button', { name: '创建邀请码(11)', exact: true }).click();
    await expect(author.getByRole('button', { name: '创建邀请码(10)', exact: true })).toBeVisible();
    code = (
      await db.query('SELECT code FROM invite_code WHERE inviter_id = $1 AND code != $2 AND used_at IS NULL', [
        'user_author_1',
        'INVITE_AUTHOR1_UNUSED',
      ])
    ).rows[0].code;
    await expect(author.getByText(code, { exact: true })).toBeVisible();
    await reader.goto('/console/be-writer');
    await reader.locator('input[name="inviteCode"]').fill(code);
    await reader.getByRole('button', { name: '成为作者', exact: true }).click();
    await expect(reader).toHaveURL('/console/invites?welcome=true');
    await expect(reader.getByText('恭喜！邀请码验证通过！', { exact: false })).toBeVisible();
    await expect(reader.getByRole('link', { name: 'Alice', exact: true })).toHaveAttribute('href', '/u/@alice');
    await reader.getByRole('link', { name: '发表新文章', exact: true }).click();
    await expect(reader.getByRole('link', { name: '创建 Markdown 文章', exact: true })).toBeVisible();
    await reader.reload();
    await expect(reader.getByRole('link', { name: '创建 Markdown 文章', exact: true })).toBeVisible();
    await reader.goto('/console/invites');
    await reader.reload();
    await expect(reader.getByRole('link', { name: 'Alice', exact: true })).toBeVisible();
    await author.reload();
    await expect(author.getByRole('link', { name: 'Carol', exact: true })).toHaveAttribute('href', '/u/@carol');
    await expect(author.getByText(code, { exact: true })).toHaveCount(0);
    await expect(author.getByRole('button', { name: '创建邀请码(10)', exact: true })).toBeVisible();
  });
});

test('Reader corrects an invalid invitation before becoming an author', async ({ actor }) => {
  const page = await actor('carol');
  await page.goto('/console/be-writer');
  for (const [code, error] of [
    ['NONEXISTENT_INVITATION', '邀请码不存在'],
    ['INVITE_AUTHOR1_USED', '邀请码已被使用'],
  ]) {
    await page.locator('input[name="inviteCode"]').fill(code);
    await page.getByRole('button', { name: '成为作者', exact: true }).click();
    await expect(page.getByText(error, { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: '邀请', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: '发表新文章', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: '成为作者', exact: true })).toBeVisible();
  }
  await page.locator('input[name="inviteCode"]').fill('INVITE_AUTHOR1_UNUSED');
  await page.getByRole('button', { name: '成为作者', exact: true }).click();
  await expect(page).toHaveURL('/console/invites?welcome=true');
  await expect(page.getByRole('link', { name: '发表新文章', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: '发表新文章', exact: true }).click();
  await expect(page.getByRole('link', { name: '创建 Markdown 文章', exact: true })).toBeVisible();
});

test('Identity conflicts stay on their fields and preserve unsaved input', async ({ actor, db }) => {
  const page = await actor('carol');
  const alice = (await db.query('SELECT name FROM "user" WHERE username = $1', ['alice'])).rows[0];
  await page.goto('/console/profile');
  await page.locator('input[name="name"]').fill(alice.name);
  await page.locator('textarea[name="aboutMe"]').fill('Keep this unsaved biography.');
  await page.getByRole('button', { name: '更新', exact: true }).click();
  await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('昵称已存在', { exact: true })).toBeVisible();
  await expect(page.locator('textarea[name="aboutMe"]')).toHaveValue('Keep this unsaved biography.');
  expect((await db.query('SELECT name FROM "user" WHERE username = $1', ['carol'])).rows[0].name).toBe('Carol');
  await page.locator('input[name="name"]').fill('Carol Conflict Resolved');
  await page.getByRole('button', { name: '更新', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Carol Conflict Resolved', exact: true })).toBeVisible();
  await page.goto('/console/account');
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  await page.locator('input[name="username"]').fill('alice');
  await page.getByRole('button', { name: '提交', exact: true }).click();
  await expect(page.locator('input[name="username"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('用户名已存在', { exact: true })).toBeVisible();
  await expect(page.locator('input[name="username"]')).toHaveValue('alice');
});

test('Registration identity conflicts display on the matching field', async ({ page }) => {
  await page.goto('/auth');
  await page.locator('input[name="username"]').fill('alice');
  await page.locator('input[name="name"]').fill('Unreserved Registration Name');
  await page.getByRole('button', { name: '使用 GitHub 注册', exact: true }).click();
  await expect(page.locator('input[name="username"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('用户名已存在', { exact: true })).toBeVisible();
  await expect(page.locator('input[name="name"]')).toHaveValue('Unreserved Registration Name');
  await page.locator('input[name="username"]').fill('unreserved-registration-user');
  await page.locator('input[name="name"]').fill('Alice');
  await page.getByRole('button', { name: '使用 GitHub 注册', exact: true }).click();
  await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('昵称已存在', { exact: true })).toBeVisible();
});

test('Profile field errors preserve values without JavaScript', async ({ browser, app, sessions }) => {
  const context = await browser.newContext({ baseURL: app, javaScriptEnabled: false });
  try {
    await context.addCookies([{ name: 'auth_session', value: sessions.get('carol')!, url: app }]);
    const page = await context.newPage();
    await page.goto('/console/profile');
    await page.locator('input[name="name"]').fill('Alice');
    await page.locator('textarea[name="aboutMe"]').fill('Retain this biography without JavaScript.');
    await page.getByRole('button', { name: '更新', exact: true }).click();
    await expect(page.getByText('昵称已存在', { exact: true })).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveValue('Alice');
    await expect(page.locator('textarea[name="aboutMe"]')).toHaveValue('Retain this biography without JavaScript.');
  } finally {
    await context.close();
  }
});
