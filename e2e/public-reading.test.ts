import { test, expect } from './support/fixtures';
import { testDataset, articleSamples, getAuthor } from '#lib/testing/data.js';
import { articleContent } from './support/journeys';

test.describe('public navigation', () => {
  test.use({
    scenario: {
      prepare: async (db) => {
        // Older author-owned records exercise both profile pagers without changing the homepage's first page.
        for (let index = 1; index <= 21; index++) {
          const id = `profile-${index}`;
          const date = new Date(Date.UTC(2025, 0, index));
          await db.query(
            'INSERT INTO article (id, user_id, title, content, content_type, path, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$7)',
            [
              id,
              'user_author_1',
              `Alice archive ${index}`,
              `# Alice archive ${index}\n\nArchive body ${index}.`,
              'markdown',
              `${id}/`,
              date,
            ],
          );
          await db.query(
            'INSERT INTO comment (id, user_id, article_id, content, path, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$6)',
            [
              `profile-comment-${index}`,
              'user_author_1',
              id,
              `Alice archive comment ${index}`,
              `profile-comment-${index}/`,
              date,
            ],
          );
          await db.query('UPDATE article SET comment_count = comment_count + 1 WHERE id = $1', [id]);
        }
      },
    },
  });

  test('Visitor browses articles and an author profile', async ({ page }) => {
    const ordered = [...testDataset.articles].reverse();
    await test.step('Browse the homepage and inspect representative metadata', async () => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(
        ordered.slice(0, 20).map((article) => article.title),
      );
      const sample = articleSamples.interactiveSample;
      const item = page
        .getByRole('article')
        .filter({ has: page.getByRole('heading', { name: sample.title, exact: true }) });
      await expect(item.getByRole('link', { name: getAuthor(sample).name, exact: true })).toHaveAttribute(
        'href',
        '/u/@alice',
      );
      await expect(item).toContainText('2026-01-01');
      for (const count of [sample.replyCount, sample.commentCount, sample.bookmarkCount]) {
        await expect(item.getByText(String(count), { exact: true })).toBeVisible();
      }
      await page
        .getByRole('navigation', { name: 'pagination' })
        .getByRole('link', { name: 'Next page', exact: true })
        .click();
      await expect(page).toHaveURL('/?page=2');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText([
        ...ordered.slice(20).map((article) => article.title),
        ...Array.from({ length: 14 }, (_, i) => `Alice archive ${21 - i}`),
      ]);
      for (const article of ordered.slice(0, 20)) {
        await expect(page.getByRole('heading', { name: article.title, exact: true })).toHaveCount(0);
      }
    });
    await test.step('Follow an article and its author; paginate both profile tabs', async () => {
      await page.getByRole('link', { name: 'External Article 01', exact: true }).click();
      await articleContent(page, 'External Article 01');
      await page.getByRole('article').getByRole('link', { name: 'Alice', exact: true }).click();
      await expect(page).toHaveURL('/u/@alice');
      await expect(page.getByRole('heading', { level: 1, name: 'Alice' })).toBeVisible();
      await expect(page.getByText('Writes about engineering and design systems.', { exact: true })).toBeVisible();
      const articleNames = await page.getByRole('heading', { level: 2 }).allTextContents();
      expect(articleNames).toHaveLength(20);
      await page
        .getByRole('navigation', { name: 'pagination' })
        .getByRole('link', { name: 'Next page', exact: true })
        .click();
      await expect(page).toHaveURL('/u/@alice?tab=articles&page=2#list-top');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(
        Array.from({ length: 14 }, (_, i) => `Alice archive ${14 - i}`),
      );
      await expect(
        page
          .getByRole('article')
          .filter({ has: page.getByRole('heading', { level: 2 }) })
          .getByRole('link', { name: 'Alice', exact: true }),
      ).toHaveCount(14);
      await page.getByRole('link', { name: '评论列表', exact: true }).click();
      await expect(page).toHaveURL('/u/@alice?tab=comments#list-top');
      await expect(page.getByText('Alice archive comment 21', { exact: true })).toBeVisible();
      await page
        .getByRole('navigation', { name: 'pagination' })
        .getByRole('link', { name: 'Next page', exact: true })
        .click();
      await expect(page).toHaveURL('/u/@alice?tab=comments&page=2#list-top');
      await expect(page.getByText('Alice archive comment 1', { exact: true })).toBeVisible();
      await expect(page.getByText('Alice archive comment 21', { exact: true })).toHaveCount(0);
      const comments = await page.getByRole('list').innerText();
      await page.reload();
      await expect(page).toHaveURL('/u/@alice?tab=comments&page=2#list-top');
      await expect(page.getByRole('list')).toHaveText(comments, { useInnerText: true });
    });
  });
});

test('Visitor reads Markdown and external articles', async ({ page }) => {
  await test.step('Read representative Markdown with a controlled image response', async () => {
    await page.route('https://picsum.photos/seed/exodus/800/400', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="teal"/></svg>',
      }),
    );
    await page.goto('/a/A25');
    await articleContent(page, 'Markdown Showcase (English)');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const article = page.getByRole('article');
    await expect(article.getByText('A paragraph with', { exact: false })).toBeVisible();
    await expect(article.getByRole('link', { name: 'Exodus', exact: true })).toHaveAttribute(
      'href',
      'https://exodus.ing',
    );
    for (const level of [2, 3, 4, 5, 6])
      await expect(article.getByRole('heading', { level, name: `Heading ${level}` })).toBeVisible();
    await expect(article.getByRole('blockquote').first()).toContainText('A blockquote for emphasis.');
    await expect(article.getByRole('listitem').filter({ hasText: 'Unordered item one' })).toBeVisible();
    await expect(article.getByRole('listitem').filter({ hasText: /^Ordered item one$/ })).toBeVisible();
    await expect(article.getByRole('code').filter({ hasText: 'inline code' })).toBeVisible();
    await expect(article.getByRole('code').filter({ hasText: 'const greeting = "Hello, Exodus";' })).toBeVisible();
    await expect(article.getByRole('table')).toBeVisible();
    await expect(article.getByRole('columnheader', { name: 'Name', exact: true })).toBeVisible();
    await expect(article.getByRole('cell', { name: 'Alpha', exact: true })).toBeVisible();
    const image = article.getByRole('img', { name: 'Sample image', exact: true });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(800);
  });
  await test.step('Read an external article and its available interactions', async () => {
    await page.goto('/a/A01');
    await articleContent(page, 'External Article 01');
    await expect(page.getByRole('article').getByRole('link', { name: 'Alice' })).toHaveAttribute('href', '/u/@alice');
    await expect(page.getByText('此文章发表于站外', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '阅读原文' })).toHaveAttribute(
      'href',
      'https://example.com/external/01',
    );
    await expect(page.getByRole('heading', { name: '回应', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '评论', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^收藏/ })).toBeVisible();
  });
});

test.describe('empty collections', () => {
  test.use({
    scenario: {
      prepare: async (db) => {
        await db.query('DELETE FROM comment WHERE user_id = $1', ['user_reader_3']);
        await db.query('DELETE FROM bookmark WHERE user_id = $1', ['user_reader_3']);
        await db.query(
          'UPDATE article SET comment_count = (SELECT count(*) FROM comment WHERE article_id = article.id), bookmark_count = (SELECT count(*) FROM bookmark WHERE article_id = article.id)',
        );
      },
    },
  });
  test('Reader profiles and empty collections remain usable', async ({ page, actor }) => {
    await page.goto('/u/@carol');
    await expect(page.getByRole('heading', { name: 'Carol', exact: true })).toBeVisible();
    await expect(page.getByText('Enjoys reading long-form essays.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '评论列表', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '文章列表', exact: true })).toHaveCount(0);
    await expect(page.getByText('Short comment on article 09.', { exact: true })).toBeVisible();
    await page.goto('/u/@frank');
    await expect(page.getByRole('heading', { name: 'Frank', exact: true })).toBeVisible();
    await expect(page.getByText('暂无评论', { exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'pagination' })).toHaveCount(0);
    const reader = await actor('frank');
    await reader.goto('/console/bookmarks');
    await expect(reader.getByText('还没有收藏的文章', { exact: true })).toBeVisible();
    await expect(reader.getByRole('navigation', { name: 'pagination' })).toHaveCount(0);
  });
});

test('Missing articles and users show a not-found result', async ({ page }) => {
  for (const path of ['/a/nonexistent-article', '/u/@nonexistent-user']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Error: 404', exact: true })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Alice', exact: true })).toHaveCount(0);
  }
});
