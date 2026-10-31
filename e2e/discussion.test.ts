import { test, expect } from './support/fixtures';
import { comment, postComment } from './support/journeys';

test('Two users exchange comments and replies', async ({ actor }) => {
  const alice = await actor('carol');
  const bob = await actor('dave');
  let first: string;
  let second: string;
  let third: string;
  await test.step('A posts a multiline comment', async () => {
    await alice.goto('/a/A06');
    first = await postComment(alice, 'A multiline journey comment.\nIts second line remains visible.');
    await expect(comment(alice, first).getByRole('link', { name: 'Carol', exact: true })).toHaveAttribute(
      'href',
      '/u/@carol',
    );
    await expect(alice.getByRole('heading', { name: '评论 2', exact: true })).toBeVisible();
  });
  await test.step('B replies to A, then A replies to B', async () => {
    await bob.goto('/a/A06');
    await comment(bob, first!).getByRole('button', { name: '回复', exact: true }).click();
    await expect(bob.getByRole('textbox')).toBeFocused();
    const form = bob.locator('form').filter({ has: bob.getByRole('textbox') });
    await expect(form).toContainText('回复 Carol');
    await expect(form).toContainText('A multiline journey comment.');
    second = await postComment(bob, 'B replies directly to A.');
    await expect(comment(bob, second)).toContainText('回复 Carol');
    await expect(comment(bob, second).getByRole('link', { name: 'Dave', exact: true })).toBeVisible();
    await expect(bob.getByRole('heading', { name: '评论 3', exact: true })).toBeVisible();
    await alice.reload();
    await comment(alice, second).getByRole('button', { name: '回复', exact: true }).click();
    third = await postComment(alice, 'A replies directly to B.');
    await expect(comment(alice, third)).toContainText('回复 Dave');
    await expect(comment(alice, third)).toContainText('B replies directly to A.');
    await expect(comment(alice, third).getByRole('link', { name: 'Carol', exact: true })).toBeVisible();
    await expect(alice.getByRole('heading', { name: '评论 4', exact: true })).toBeVisible();
  });
  await test.step('Reload the discussion and follow A’s profile comment link', async () => {
    await alice.reload();
    await expect(comment(alice, first!)).toContainText('Its second line remains visible.');
    await expect(comment(alice, second!)).toContainText('回复 Carol');
    await expect(comment(alice, third!)).toContainText('回复 Dave');
    await expect(alice.getByRole('heading', { name: '评论 4', exact: true })).toBeVisible();
    await alice.goto('/u/@carol?tab=comments');
    await expect(alice.getByText('A replies directly to B.', { exact: true })).toBeVisible();
    await expect(alice.getByText('A multiline journey comment.', { exact: false })).toBeVisible();
    await alice.getByRole('link', { name: 'Sample Article 06', exact: true }).click();
    await expect(alice).toHaveURL('/a/A06');
  });
});

test('User cancels and saves edits to an existing comment', async ({ actor }) => {
  const page = await actor('carol');
  const original = 'Great showcase of markdown features.';
  await page.goto('/a/A25');
  await test.step('Cancel an edit without changing the original', async () => {
    await comment(page, 'C01').getByRole('button', { name: '编辑', exact: true }).click();
    await expect(page.getByRole('textbox')).toHaveValue(original);
    await page.getByRole('textbox').fill('This edit will be cancelled.');
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await expect(comment(page, 'C01').getByText(original, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveValue('');
    await expect(page.getByRole('button', { name: '更新评论', exact: true })).toHaveCount(0);
  });
  await test.step('Save another edit without adding a comment', async () => {
    await comment(page, 'C01').getByRole('button', { name: '编辑', exact: true }).click();
    await page.getByRole('textbox').fill('The saved comment edit persists.');
    await page.getByRole('button', { name: '更新评论', exact: true }).click();
    await expect(page).toHaveURL('/a/A25#comment-C01');
    await expect(comment(page, 'C01').getByText('The saved comment edit persists.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '评论 14', exact: true })).toBeVisible();
    await page.reload();
    await expect(comment(page, 'C01').getByText('The saved comment edit persists.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '回复', exact: true })).toHaveCount(14);
    await expect(page.getByRole('heading', { name: '评论 14', exact: true })).toBeVisible();
  });
  const other = await actor('dave');
  await other.goto('/a/A25');
  await expect(comment(other, 'C01').getByText('The saved comment edit persists.', { exact: true })).toBeVisible();
  await expect(comment(other, 'C01').getByRole('button', { name: '编辑', exact: true })).toHaveCount(0);
});

test.describe('bookmark pagination', () => {
  test.use({
    scenario: {
      prepare: async (db) => {
        await db.query('DELETE FROM bookmark WHERE user_id = $1 AND article_id = $2', ['user_reader_1', 'A01']);
        await db.query('UPDATE article SET bookmark_count = bookmark_count - 1 WHERE id = $1', ['A01']);
      },
    },
  });
  test('User adds and removes a bookmark', async ({ actor }) => {
    const page = await actor('carol');
    await test.step('Save an article and find it after reloading', async () => {
      await page.goto('/a/A01');
      await page.getByRole('button', { name: '收藏 1', exact: true }).first().click();
      await expect(page.getByRole('button', { name: '已收藏 2', exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('button', { name: '已收藏 2', exact: true })).toBeVisible();
      await page.goto('/console/bookmarks');
      await expect(page.getByRole('link', { name: 'External Article 01', exact: true })).toHaveCount(0);
      await page
        .getByRole('navigation', { name: 'pagination' })
        .getByRole('link', { name: 'Next page', exact: true })
        .click();
      await expect(page).toHaveURL('/console/bookmarks?page=2');
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(2);
      await expect(page.getByRole('link', { name: 'External Article 01', exact: true })).toHaveAttribute(
        'href',
        '/a/A01',
      );
      await page.getByRole('link', { name: 'External Article 01', exact: true }).click();
    });
    await test.step('Remove the bookmark and verify both pages of the saved collection', async () => {
      await page.getByRole('button', { name: '已收藏 2', exact: true }).first().click();
      await expect(page.getByRole('button', { name: '收藏 1', exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('button', { name: '收藏 1', exact: true })).toBeVisible();
      await page.goto('/console/bookmarks');
      await expect(page.getByRole('link', { name: 'External Article 01', exact: true })).toHaveCount(0);
      await page
        .getByRole('navigation', { name: 'pagination' })
        .getByRole('link', { name: 'Next page', exact: true })
        .click();
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1);
      await expect(page.getByRole('link', { name: 'External Article 01', exact: true })).toHaveCount(0);
    });
  });
});

test('Invalid hidden discussion context reaches the error page', async ({ actor, db }) => {
  const page = await actor('carol');
  const before = (await db.query('SELECT count(*) FROM comment')).rows[0].count;
  await page.goto('/a/A25');
  await page.locator('#comment-input').fill('This must not become an orphan comment.');
  await page.locator('#comment-section input[name^="articleId/"]').evaluate((input) => {
    (input as HTMLInputElement).value = 'absent';
  });
  await page.getByRole('button', { name: '发表评论', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Error: 404', exact: true })).toBeVisible();
  expect((await db.query('SELECT count(*) FROM comment')).rows[0].count).toBe(before);
});
