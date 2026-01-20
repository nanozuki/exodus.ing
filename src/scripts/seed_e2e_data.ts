import {
  tArticle,
  tBookmark,
  tComment,
  tInviteCode,
  tPendingAuth,
  tSession,
  tUser,
  tUserAuth,
  tUserRole,
} from '$lib/server/repositories/schema';
import { encodeIdPath, type IdPath } from '$lib/domain/values/id_path';
import { Role } from '$lib/domain/entities/role';
import type { ArticleContentType } from '$lib/domain/entities/article';
import { sql } from 'drizzle-orm/sql';
import { pathToFileURL } from 'node:url';
import { schema } from '$lib/server/repositories/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { buildDatabaseUrl, DB_NAME } from '$lib/server/repositories';

type ArticleSeedInput = {
  id: string;
  userId: string;
  title: string;
  contentType: ArticleContentType;
  content: string;
  replyToId?: string;
};

type CommentSeedInput = {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  replyToId?: string;
};

type ArticleSeed = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  title: string;
  content: string;
  contentType: ArticleContentType;
  path: string;
  replyCount: number;
  bookmarkCount: number;
  commentCount: number;
};

type CommentSeed = {
  id: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  articleId: string;
  content: string;
};

const baseTime = new Date('2024-01-01T00:00:00Z');
let minuteOffset = 0;
const nextTime = () => new Date(baseTime.getTime() + minuteOffset++ * 60 * 1000);
const nextTimestamps = () => {
  const createdAt = nextTime();
  return { createdAt, updatedAt: createdAt };
};

const markdownShowcaseEn = [
  '# Heading 1',
  '',
  'A paragraph with **bold text**, _italic text_, and `inline code`.',
  'Visit [Exodus](https://exodus.ing) for more updates.',
  '',
  '---',
  '',
  '## Heading 2',
  '',
  '> A blockquote for emphasis.',
  '>',
  '> > A nested blockquote for depth.',
  '>',
  '> > > Another nested blockquote level.',
  '',
  '### Heading 3',
  '',
  '![Sample image](https://picsum.photos/seed/exodus/800/400)',
  '',
  '#### Heading 4',
  '',
  '```ts',
  'const greeting = "Hello, Exodus";',
  'console.log(greeting);',
  '```',
  '',
  '##### Heading 5',
  '',
  '- Unordered item one',
  '- Unordered item two',
  '  - Nested unordered item',
  '',
  '1. Ordered item one',
  '2. Ordered item two',
  '',
  '###### Heading 6',
  '',
  '| Name | Value |',
  '| --- | --- |',
  '| Alpha | 1 |',
  '| Beta | 2 |',
].join('\n');

const markdownShowcaseZh = [
  '# 标题一',
  '',
  '这是一个段落，包含**加粗文字**、_斜体文字_，以及`行内代码`。',
  '查看 [Exodus](https://exodus.ing) 获取更多信息。',
  '',
  '---',
  '',
  '## 标题二',
  '',
  '> 这是一级引用。',
  '>',
  '> > 这是二级引用。',
  '>',
  '> > > 这是三级引用。',
  '',
  '### 标题三',
  '',
  '![示例图片](https://picsum.photos/seed/exodus-zh/800/400)',
  '',
  '#### 标题四',
  '',
  '```ts',
  'const note = "你好，Exodus";',
  'console.log(note);',
  '```',
  '',
  '##### 标题五',
  '',
  '- 无序列表一',
  '- 无序列表二',
  '  - 嵌套无序列表',
  '',
  '1. 有序列表一',
  '2. 有序列表二',
  '',
  '###### 标题六',
  '',
  '| 名称 | 数值 |',
  '| --- | --- |',
  '| 甲 | 1 |',
  '| 乙 | 2 |',
].join('\n');

export async function seedE2EData(databaseUrl: string): Promise<void> {
  const db = drizzle(databaseUrl, { schema, logger: true });

  const users = {
    reader3: {
      id: 'user_reader_3',
      username: 'frank',
      name: 'Frank',
      aboutMe: 'Prefers exploring new articles and bookmarks.',
      verifyCode: 'verify_frank',
      githubId: null,
      ...nextTimestamps(),
    },
    author1: {
      id: 'user_author_1',
      username: 'alice',
      name: 'Alice',
      aboutMe: 'Writes about engineering and design systems.',
      verifyCode: 'verify_alice',
      githubId: null,
      ...nextTimestamps(),
    },
    author2: {
      id: 'user_author_2',
      username: 'bob',
      name: 'Bob',
      aboutMe: 'Focuses on product insights and growth.',
      verifyCode: 'verify_bob',
      githubId: null,
      ...nextTimestamps(),
    },
    reader1: {
      id: 'user_reader_1',
      username: 'carol',
      name: 'Carol',
      aboutMe: 'Enjoys reading long-form essays.',
      verifyCode: 'verify_carol',
      githubId: null,
      ...nextTimestamps(),
    },
    reader2: {
      id: 'user_reader_2',
      username: 'dave',
      name: 'Dave',
      aboutMe: 'Reads and bookmarks external articles.',
      verifyCode: 'verify_dave',
      githubId: null,
      ...nextTimestamps(),
    },
    invitedAuthor: {
      id: 'user_invited_author',
      username: 'erin',
      name: 'Erin',
      aboutMe: 'Invited author exploring markdown workflows.',
      verifyCode: 'verify_erin',
      githubId: null,
      ...nextTimestamps(),
    },
  };

  const articleInputs: ArticleSeedInput[] = [
    {
      id: 'A01',
      userId: users.author1.id,
      title: 'External Article 01',
      contentType: 'external',
      content: 'https://example.com/external/01',
    },
    {
      id: 'A02',
      userId: users.author1.id,
      title: 'External Article 02',
      contentType: 'external',
      content: 'https://example.com/external/02',
    },
    {
      id: 'A03',
      userId: users.author1.id,
      title: 'External Article 03',
      contentType: 'external',
      content: 'https://example.com/external/03',
    },
    {
      id: 'A04',
      userId: users.author1.id,
      title: 'External Article 04',
      contentType: 'external',
      content: 'https://example.com/external/04',
    },
    {
      id: 'A05',
      userId: users.author1.id,
      title: 'External Article 05',
      contentType: 'external',
      content: 'https://example.com/external/05',
    },
    {
      id: 'A06',
      userId: users.author1.id,
      title: 'Sample Article 06',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 06.',
    },
    {
      id: 'A07',
      userId: users.author1.id,
      title: 'Sample Article 07',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 07.',
    },
    {
      id: 'A08',
      userId: users.author1.id,
      title: 'Sample Article 08',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 08.',
    },
    {
      id: 'A09',
      userId: users.author1.id,
      title: 'Sample Article 09',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 09.',
    },
    {
      id: 'A10',
      userId: users.author1.id,
      title: 'Sample Article 10',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 10.',
    },
    {
      id: 'A11',
      userId: users.author2.id,
      title: 'Sample Article 11',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 11.',
    },
    {
      id: 'A12',
      userId: users.author2.id,
      title: 'Sample Article 12',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 12.',
    },
    {
      id: 'A13',
      userId: users.author2.id,
      title: 'Sample Article 13',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 13.',
    },
    {
      id: 'A14',
      userId: users.author2.id,
      title: 'Sample Article 14',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 14.',
    },
    {
      id: 'A15',
      userId: users.author2.id,
      title: 'Sample Article 15',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 15.',
    },
    {
      id: 'A16',
      userId: users.author2.id,
      title: 'Sample Article 16',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 16.',
    },
    {
      id: 'A17',
      userId: users.author2.id,
      title: 'Sample Article 17',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 17.',
    },
    {
      id: 'A18',
      userId: users.author2.id,
      title: 'Sample Article 18',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 18.',
    },
    {
      id: 'A19',
      userId: users.author2.id,
      title: 'Sample Article 19',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 19.',
    },
    {
      id: 'A20',
      userId: users.author2.id,
      title: 'Sample Article 20',
      contentType: 'markdown',
      content: 'Seeded markdown content for article 20.',
    },
    {
      id: 'A21',
      userId: users.author1.id,
      title: 'Discussion Root',
      contentType: 'markdown',
      content: 'Root article for reply chain demos.',
    },
    {
      id: 'A22',
      userId: users.author2.id,
      title: 'Reply from Bob',
      contentType: 'markdown',
      content: 'A reply to the root discussion.',
      replyToId: 'A21',
    },
    {
      id: 'A23',
      userId: users.author1.id,
      title: 'Reply from Alice',
      contentType: 'markdown',
      content: 'Another reply to the root discussion.',
      replyToId: 'A21',
    },
    {
      id: 'A24',
      userId: users.invitedAuthor.id,
      title: 'Nested Reply from Erin',
      contentType: 'markdown',
      content: 'A nested reply to demonstrate depth.',
      replyToId: 'A22',
    },
    {
      id: 'A25',
      userId: users.author1.id,
      title: 'Markdown Showcase (English)',
      contentType: 'markdown',
      content: markdownShowcaseEn,
    },
    {
      id: 'A26',
      userId: users.author2.id,
      title: 'Markdown Showcase（中文）',
      contentType: 'markdown',
      content: markdownShowcaseZh,
    },
  ];

  const articleRows: ArticleSeed[] = [];
  const articleMap = new Map<string, ArticleSeed>();
  const articlePaths = new Map<string, IdPath>();
  for (const input of articleInputs) {
    const timestamps = nextTimestamps();
    const parentPath = input.replyToId ? articlePaths.get(input.replyToId) : undefined;
    if (input.replyToId && !parentPath) {
      throw new Error(`Missing parent article ${input.replyToId}`);
    }
    const path = parentPath ? [...parentPath, input.id] : [input.id];
    const article: ArticleSeed = {
      id: input.id,
      userId: input.userId,
      title: input.title,
      content: input.content,
      contentType: input.contentType,
      path: encodeIdPath(path),
      replyCount: 0,
      bookmarkCount: 0,
      commentCount: 0,
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
    };
    articleRows.push(article);
    articleMap.set(article.id, article);
    articlePaths.set(article.id, path);
    if (input.replyToId) {
      const parent = articleMap.get(input.replyToId);
      if (!parent) {
        throw new Error(`Missing reply parent ${input.replyToId}`);
      }
      parent.replyCount += 1;
    }
  }

  const commentInputs: CommentSeedInput[] = [
    { id: 'C01', articleId: 'A25', userId: users.reader1.id, content: 'Great showcase of markdown features.' },
    { id: 'C02', articleId: 'A25', userId: users.reader1.id, content: 'Appreciate the thorough examples.' },
    { id: 'C03', articleId: 'A25', userId: users.reader2.id, content: 'The tables look crisp here.' },
    { id: 'C04', articleId: 'A25', userId: users.reader1.id, content: 'Blockquotes read nicely.' },
    { id: 'C05', articleId: 'A25', userId: users.author2.id, content: 'Thanks for sharing this draft.' },
    { id: 'C06', articleId: 'A25', userId: users.reader1.id, content: 'The image scales well.' },
    { id: 'C07', articleId: 'A25', userId: users.reader1.id, content: 'Lists and code blocks are solid.' },
    { id: 'C08', articleId: 'A25', userId: users.reader1.id, content: 'Looking forward to more.' },
    {
      id: 'C09',
      articleId: 'A25',
      userId: users.reader2.id,
      content: 'Replying to the first comment.',
      replyToId: 'C01',
    },
    { id: 'C10', articleId: 'A25', userId: users.reader1.id, content: 'Thanks for the feedback!', replyToId: 'C09' },
    { id: 'C11', articleId: 'A25', userId: users.author1.id, content: 'Glad it helps!', replyToId: 'C01' },
    { id: 'C12', articleId: 'A25', userId: users.reader1.id, content: 'Adding more notes.', replyToId: 'C02' },
    { id: 'C13', articleId: 'A25', userId: users.reader1.id, content: 'Nested reply testing.', replyToId: 'C04' },
    { id: 'C14', articleId: 'A25', userId: users.reader2.id, content: 'Third-level reply check.', replyToId: 'C13' },
    { id: 'C15', articleId: 'A21', userId: users.reader1.id, content: 'Thread kickoff comment.' },
    { id: 'C16', articleId: 'A21', userId: users.reader1.id, content: 'Following up on the thread.' },
    { id: 'C17', articleId: 'A21', userId: users.reader2.id, content: 'Replying with another view.' },
    { id: 'C18', articleId: 'A21', userId: users.reader1.id, content: 'Closing thoughts on the thread.' },
    { id: 'C19', articleId: 'A01', userId: users.reader1.id, content: 'Bookmark-worthy external link.' },
    { id: 'C20', articleId: 'A01', userId: users.reader1.id, content: 'Second note on this link.' },
    { id: 'C21', articleId: 'A02', userId: users.reader1.id, content: 'Short comment on article 02.' },
    { id: 'C22', articleId: 'A03', userId: users.reader1.id, content: 'Short comment on article 03.' },
    { id: 'C23', articleId: 'A04', userId: users.reader1.id, content: 'Short comment on article 04.' },
    { id: 'C24', articleId: 'A05', userId: users.reader1.id, content: 'Short comment on article 05.' },
    { id: 'C25', articleId: 'A06', userId: users.reader1.id, content: 'Short comment on article 06.' },
    { id: 'C26', articleId: 'A07', userId: users.reader1.id, content: 'Short comment on article 07.' },
    { id: 'C27', articleId: 'A08', userId: users.reader1.id, content: 'Short comment on article 08.' },
    { id: 'C28', articleId: 'A09', userId: users.reader1.id, content: 'Short comment on article 09.' },
  ];

  const commentRows: CommentSeed[] = [];
  const commentPaths = new Map<string, IdPath>();
  for (const input of commentInputs) {
    const timestamps = nextTimestamps();
    const parentPath = input.replyToId ? commentPaths.get(input.replyToId) : undefined;
    if (input.replyToId && !parentPath) {
      throw new Error(`Missing parent comment ${input.replyToId}`);
    }
    const path = parentPath ? [...parentPath, input.id] : [input.id];
    const comment: CommentSeed = {
      id: input.id,
      path: encodeIdPath(path),
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
      userId: input.userId,
      articleId: input.articleId,
      content: input.content,
    };
    commentRows.push(comment);
    commentPaths.set(input.id, path);
    const article = articleMap.get(input.articleId);
    if (!article) {
      throw new Error(`Missing article ${input.articleId} for comment ${input.id}`);
    }
    article.commentCount += 1;
  }

  const bookmarkRows = [
    ...[
      'A01',
      'A02',
      'A03',
      'A04',
      'A05',
      'A06',
      'A07',
      'A08',
      'A09',
      'A10',
      'A11',
      'A12',
      'A13',
      'A14',
      'A15',
      'A16',
      'A17',
      'A18',
      'A19',
      'A20',
      'A21',
      'A22',
    ].map((articleId) => ({
      userId: users.reader1.id,
      articleId,
      createdAt: nextTime(),
    })),
    { userId: users.reader2.id, articleId: 'A25', createdAt: nextTime() },
    { userId: users.reader2.id, articleId: 'A26', createdAt: nextTime() },
    { userId: users.reader2.id, articleId: 'A01', createdAt: nextTime() },
    { userId: users.author1.id, articleId: 'A25', createdAt: nextTime() },
    { userId: users.reader3.id, articleId: 'A25', createdAt: nextTime() },
  ];

  for (const bookmark of bookmarkRows) {
    const article = articleMap.get(bookmark.articleId);
    if (!article) {
      throw new Error(`Missing article ${bookmark.articleId} for bookmark`);
    }
    article.bookmarkCount += 1;
  }

  const userRoles = [
    {
      userId: users.author1.id,
      roleKey: Role.ArticleAuthor,
      inviterId: null,
      invitedAt: nextTime(),
    },
    {
      userId: users.author2.id,
      roleKey: Role.ArticleAuthor,
      inviterId: null,
      invitedAt: nextTime(),
    },
    {
      userId: users.invitedAuthor.id,
      roleKey: Role.ArticleAuthor,
      inviterId: users.author1.id,
      invitedAt: nextTime(),
    },
  ];

  const inviteCodes = [
    {
      id: 1,
      code: 'INVITE_AUTHOR1_USED',
      roleKey: Role.ArticleAuthor,
      inviterId: users.author1.id,
      usedAt: nextTime(),
    },
    {
      id: 2,
      code: 'INVITE_AUTHOR2_USED',
      roleKey: Role.ArticleAuthor,
      inviterId: users.author2.id,
      usedAt: nextTime(),
    },
    {
      id: 3,
      code: 'INVITE_AUTHOR1_UNUSED',
      roleKey: Role.ArticleAuthor,
      inviterId: users.author1.id,
      usedAt: null,
    },
    {
      id: 4,
      code: 'INVITE_AUTHOR2_UNUSED',
      roleKey: Role.ArticleAuthor,
      inviterId: users.author2.id,
      usedAt: null,
    },
  ];

  await db.transaction(async (tx) => {
    await tx.delete(tBookmark);
    await tx.delete(tComment);
    await tx.delete(tInviteCode);
    await tx.delete(tUserRole);
    await tx.delete(tSession);
    await tx.delete(tUserAuth);
    await tx.delete(tPendingAuth);
    await tx.delete(tArticle);
    await tx.delete(tUser);

    await tx.insert(tUser).values(Object.values(users));
    await tx.insert(tUserRole).values(userRoles);
    await tx.insert(tInviteCode).values(inviteCodes);
    await tx.insert(tArticle).values(articleRows);
    await tx.insert(tBookmark).values(bookmarkRows);
    await tx.insert(tComment).values(commentRows);

    await tx.execute(
      sql`SELECT setval(pg_get_serial_sequence('invite_code', 'id'), (SELECT COALESCE(MAX(id), 1) FROM invite_code))`,
    );
  });

  console.log(`[SEED] inserted ${Object.values(users).length} users`);
  console.log(`[SEED] inserted ${articleRows.length} articles`);
  console.log(`[SEED] inserted ${bookmarkRows.length} bookmarks`);
  console.log(`[SEED] inserted ${commentRows.length} comments`);
  console.log(`[SEED] inserted ${inviteCodes.length} invite codes`);
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  await seedE2EData(buildDatabaseUrl(DB_NAME.app));
}
