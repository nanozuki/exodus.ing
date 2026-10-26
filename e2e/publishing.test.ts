import { test, expect } from './support/fixtures';
import { articleContent, publishMarkdown } from './support/journeys';
import { setTimeout as delay } from 'node:timers/promises';

test('Author publishes and edits a Markdown article', async ({ actor }) => {
  const page = await actor('alice');
  let path: string;
  const source = '# A new Markdown journey\n\nA **formatted** first body.';
  await test.step('Choose Markdown, preview and publish', async () => {
    await page.goto('/u/@alice');
    await page.getByRole('link', { name: '新文章', exact: true }).click();
    await page.getByRole('link', { name: '创建 Markdown 文章', exact: true }).click();
    path = await publishMarkdown(
      page,
      'A new Markdown journey',
      'A **formatted** first body.',
      'A formatted first body.',
    );
    await articleContent(page, 'A new Markdown journey', 'A formatted first body.');
    await expect(page.getByRole('article').getByRole('link', { name: 'Alice', exact: true })).toHaveAttribute(
      'href',
      '/u/@alice',
    );
  });
  await test.step('Reload, reopen saved source and edit', async () => {
    await page.reload();
    await articleContent(page, 'A new Markdown journey', 'A formatted first body.');
    await page.getByRole('link', { name: '编辑', exact: true }).first().click();
    await expect(page.getByRole('textbox')).toHaveValue(source);
    const editedPath = await publishMarkdown(
      page,
      'Revised Markdown journey',
      'The **revised** body persists.',
      'The revised body persists.',
    );
    expect(editedPath).toBe(path);
    await articleContent(page, 'Revised Markdown journey', 'The revised body persists.');
    await page.reload();
    await articleContent(page, 'Revised Markdown journey', 'The revised body persists.');
  });
  await test.step('Find the saved article in both lists', async () => {
    for (const list of ['/', '/u/@alice']) {
      await page.goto(list);
      await expect(page.getByRole('link', { name: 'Revised Markdown journey', exact: true })).toHaveAttribute(
        'href',
        path!,
      );
      await expect(page.getByRole('link', { name: 'A new Markdown journey', exact: true })).toHaveCount(0);
    }
  });
});

test('Author corrects invalid Markdown before publishing', async ({ actor, db }) => {
  const page = await actor('alice');
  const before = (await db.query('SELECT count(*) FROM article')).rows[0].count;
  await page.goto('/a/new/edit?contentType=markdown');
  await page.getByRole('textbox').fill('This body is missing its required title.');
  await expect(page.getByText('缺少标题', { exact: true })).toBeVisible();
  await expect(page.getByText('标题为第一个一级标题', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '发布', exact: true })).toBeDisabled();
  expect((await db.query('SELECT count(*) FROM article')).rows[0].count).toBe(before);
  await publishMarkdown(page, 'Corrected Markdown title', 'This body is missing its required title.');
  await articleContent(page, 'Corrected Markdown title', 'This body is missing its required title.');
  await page.reload();
  await articleContent(page, 'Corrected Markdown title', 'This body is missing its required title.');
});

test('Author verifies a domain to publish and edit an external article', async ({ actor, db }) => {
  const page = await actor('alice');
  const url = 'https://crows.moe/e2e-original';
  const before = (await db.query('SELECT count(*) FROM article')).rows[0].count;
  await test.step('Submit with a nonmatching verification code', async () => {
    await page.goto('/a/new/edit');
    await page.getByRole('link', { name: '链接外部文章', exact: true }).click();
    await page.locator('input[name="url"]').fill(url);
    await page.locator('input[name="title"]').fill('Verified external journey');
    await expect(
      page.getByText('提交前，请确保你为域名 crows.moe 设置了 TXT 类型的 DNS 记录：', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('exodus-site-verification=verify_alice', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '发布', exact: true }).click();
    await expect(page.getByText('无法验证站点所有权，请按照说明添加 TXT 记录后重试', { exact: false })).toBeVisible();
    await expect(page.locator('input[name="url"]')).toHaveValue(url);
    await expect(page.locator('input[name="title"]')).toHaveValue('Verified external journey');
    expect((await db.query('SELECT count(*) FROM article')).rows[0].count).toBe(before);
  });
  await test.step('Match the real DNS record and publish', async () => {
    await db.query('UPDATE "user" SET verify_code = $1 WHERE username = $2', [
      'g8nlb5qg59n11wh6f7bpgnqc9wb2muaq',
      'alice',
    ]);
    await page.reload();
    await page.locator('input[name="url"]').fill(url);
    await page.locator('input[name="title"]').fill('Verified external journey');
    await page.getByRole('button', { name: '发布', exact: true }).click();
    await expect(page).toHaveURL(/\/a\/[^/?#]+$/);
    await articleContent(page, 'Verified external journey');
    await expect(page.getByRole('link', { name: '阅读原文' })).toHaveAttribute('href', url);
    await page.reload();
    await articleContent(page, 'Verified external journey');
    await expect(page.getByRole('link', { name: '阅读原文' })).toHaveAttribute('href', url);
  });
  await test.step('Edit the title and original URL and reload', async () => {
    await page.getByRole('link', { name: '编辑', exact: true }).click();
    await expect(page.locator('input[name="url"]')).toHaveValue(url);
    await expect(page.locator('input[name="title"]')).toHaveValue('Verified external journey');
    await page.locator('input[name="url"]').fill('https://crows.moe/e2e-revised');
    await page.locator('input[name="title"]').fill('Revised external journey');
    await page.getByRole('button', { name: '发布', exact: true }).click();
    await articleContent(page, 'Revised external journey');
    await expect(page.getByRole('link', { name: '阅读原文' })).toHaveAttribute('href', 'https://crows.moe/e2e-revised');
    await page.reload();
    await articleContent(page, 'Revised external journey');
    await expect(page.getByRole('link', { name: '阅读原文' })).toHaveAttribute('href', 'https://crows.moe/e2e-revised');
  });
});

test('Author creates and follows nested article responses', async ({ actor }) => {
  const page = await actor('alice');
  let first: string;
  let second: string;
  await test.step('Respond to an existing article', async () => {
    await page.goto('/a/A06');
    await page.locator('#reply-section').getByRole('link', { name: '回应', exact: true }).click();
    await page.getByRole('link', { name: '创建 Markdown 文章', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Sample Article 06', exact: true })).toHaveAttribute('href', '/a/A06');
    first = await publishMarkdown(page, 'First response journey', 'Responding to the original.');
    await expect(
      page.getByRole('article').getByRole('link', { name: 'Sample Article 06', exact: true }),
    ).toHaveAttribute('href', '/a/A06');
    await page.getByRole('article').getByRole('link', { name: 'Sample Article 06', exact: true }).click();
    await expect(page.getByRole('link', { name: 'First response journey', exact: true })).toHaveAttribute(
      'href',
      first,
    );
    await expect(page.getByRole('heading', { name: '回应文章 1', exact: true })).toBeVisible();
    // Delay the destination's queries so old-page controls remain visible during the transition.
    const remoteQueries = '**/_app/remote/**';
    await page.route(remoteQueries, async (route) => {
      await delay(250);
      await route.continue();
    });
    await page.getByRole('link', { name: 'First response journey', exact: true }).click();
    await expect(page).toHaveURL(first);
    await articleContent(page, 'First response journey', 'Responding to the original.');
    await page.unroute(remoteQueries);
  });
  await test.step('Respond to the response and follow direct parents', async () => {
    await page.locator('#reply-section').getByRole('link', { name: '回应', exact: true }).click();
    await page.getByRole('link', { name: '创建 Markdown 文章', exact: true }).click();
    await expect(page.getByRole('link', { name: 'First response journey', exact: true })).toHaveAttribute(
      'href',
      first!,
    );
    second = await publishMarkdown(page, 'Nested response journey', 'Responding to the first response.');
    await expect(
      page.getByRole('article').getByRole('link', { name: 'First response journey', exact: true }),
    ).toHaveAttribute('href', first!);
    await page.getByRole('article').getByRole('link', { name: 'First response journey', exact: true }).click();
    await expect(page).toHaveURL(first!);
    await articleContent(page, 'First response journey', 'Responding to the original.');
    await expect(page.getByRole('link', { name: 'Nested response journey', exact: true })).toHaveAttribute(
      'href',
      second,
    );
    await expect(page.getByRole('heading', { name: '回应文章 1', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: 'Nested response journey', exact: true })).toHaveAttribute(
      'href',
      second,
    );
    await expect(page.getByRole('heading', { name: '回应文章 1', exact: true })).toBeVisible();
    await page.getByRole('article').getByRole('link', { name: 'Sample Article 06', exact: true }).click();
    await expect(page).toHaveURL('/a/A06');
    await page.reload();
    await expect(page.getByRole('heading', { name: '回应文章 1', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'First response journey', exact: true })).toHaveAttribute(
      'href',
      first!,
    );
    await expect(page.getByRole('link', { name: 'Nested response journey', exact: true })).toHaveCount(0);
    await page.goto(second);
    await page.reload();
    await expect(
      page.getByRole('article').getByRole('link', { name: 'First response journey', exact: true }),
    ).toHaveAttribute('href', first!);
  });
});
