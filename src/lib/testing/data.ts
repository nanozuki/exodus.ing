import { Role } from '$lib/domain/entities/role';
import { encodeIdPath, type IdPath } from '$lib/domain/values/id_path';
import type { tArticle, tBookmark, tComment, tInviteCode, tUser, tUserRole } from '$lib/server/repositories/schema';

export type UserSeed = typeof tUser.$inferInsert;
export type ArticleSeed = typeof tArticle.$inferInsert;
export type BookmarkSeed = typeof tBookmark.$inferInsert;
export type CommentSeed = typeof tComment.$inferInsert;
export type UserRoleSeed = typeof tUserRole.$inferInsert;
export type InviteCodeSeed = typeof tInviteCode.$inferInsert;

type TestDataset = {
  users: UserSeed[];
  articles: ArticleSeed[];
  bookmarks: BookmarkSeed[];
  comments: CommentSeed[];
  userRoles: UserRoleSeed[];
  inviteCodes: InviteCodeSeed[];
};

const { nextTime, nextTimestamps } = (() => {
  const baseTime = new Date('2026-01-01T00:00:00Z');
  let minuteOffset = 0;
  return {
    nextTime: () => new Date(baseTime.getTime() + minuteOffset++ * 60 * 1000),
    nextTimestamps: () => {
      const createdAt = nextTime();
      return { createdAt, updatedAt: createdAt };
    },
  };
})();

// --- Relation and Utils Data ---

const userIds: Record<string, string> = {
  author1: 'user_author_1',
  author2: 'user_author_2',
  reader1: 'user_reader_1',
  reader2: 'user_reader_2',
  reader3: 'user_reader_3',
  invitedAuthor: 'user_invited_author',
};

const articleMarkdowns: Record<string, string> = {
  A06: ['# Sample Article 06', '', 'Seeded markdown content for article 06.'].join('\n'),
  A07: ['# Sample Article 07', '', 'Seeded markdown content for article 07.'].join('\n'),
  A08: ['# Sample Article 08', '', 'Seeded markdown content for article 08.'].join('\n'),
  A09: ['# Sample Article 09', '', 'Seeded markdown content for article 09.'].join('\n'),
  A10: ['# Sample Article 10', '', 'Seeded markdown content for article 10.'].join('\n'),
  A11: ['# Sample Article 11', '', 'Seeded markdown content for article 11.'].join('\n'),
  A12: ['# Sample Article 12', '', 'Seeded markdown content for article 12.'].join('\n'),
  A13: ['# Sample Article 13', '', 'Seeded markdown content for article 13.'].join('\n'),
  A14: ['# Sample Article 14', '', 'Seeded markdown content for article 14.'].join('\n'),
  A15: ['# Sample Article 15', '', 'Seeded markdown content for article 15.'].join('\n'),
  A16: ['# Sample Article 16', '', 'Seeded markdown content for article 16.'].join('\n'),
  A17: ['# Sample Article 17', '', 'Seeded markdown content for article 17.'].join('\n'),
  A18: ['# Sample Article 18', '', 'Seeded markdown content for article 18.'].join('\n'),
  A19: ['# Sample Article 19', '', 'Seeded markdown content for article 19.'].join('\n'),
  A20: ['# Sample Article 20', '', 'Seeded markdown content for article 20.'].join('\n'),
  A21: ['# Discussion Root', '', 'Root article for reply chain demos.'].join('\n'),
  A22: ['# Reply from Bob', '', 'A reply to the root discussion.'].join('\n'),
  A23: ['# Reply from Alice', '', 'Another reply to the root discussion.'].join('\n'),
  A24: ['# Nested Reply from Erin', '', 'A nested reply to demonstrate depth.'].join('\n'),
  A25: [
    '# Markdown Showcase (English)',
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
  ].join('\n'),
  A26: [
    '# Markdown Showcase（中文）',
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
  ].join('\n'),
};

const userBookmarks: Record<string, string[]> = {
  A01: [userIds.reader1, userIds.reader2],
  A02: [userIds.reader1],
  A03: [userIds.reader1],
  A04: [userIds.reader1],
  A05: [userIds.reader1],
  A06: [userIds.reader1],
  A07: [userIds.reader1],
  A08: [userIds.reader1],
  A09: [userIds.reader1],
  A10: [userIds.reader1],
  A11: [userIds.reader1],
  A12: [userIds.reader1],
  A13: [userIds.reader1],
  A14: [userIds.reader1],
  A15: [userIds.reader1],
  A16: [userIds.reader1],
  A17: [userIds.reader1],
  A18: [userIds.reader1],
  A19: [userIds.reader1],
  A20: [userIds.reader1],
  A21: [userIds.reader1],
  A22: [userIds.reader1],
  A25: [userIds.reader2, userIds.author1, userIds.reader3],
  A26: [userIds.reader2],
};

const articleReplyPairs: Record<string, string> = {
  A22: 'A21',
  A23: 'A21',
  A24: 'A22',
};

const commentRelations: { id: string; articleId: string; replyToId?: string }[] = [
  { id: 'C01', articleId: 'A25' },
  { id: 'C02', articleId: 'A25' },
  { id: 'C03', articleId: 'A25' },
  { id: 'C04', articleId: 'A25' },
  { id: 'C05', articleId: 'A25' },
  { id: 'C06', articleId: 'A25' },
  { id: 'C07', articleId: 'A25' },
  { id: 'C08', articleId: 'A25' },
  { id: 'C09', articleId: 'A25', replyToId: 'C01' },
  { id: 'C10', articleId: 'A25', replyToId: 'C09' },
  { id: 'C11', articleId: 'A25', replyToId: 'C01' },
  { id: 'C12', articleId: 'A25', replyToId: 'C02' },
  { id: 'C13', articleId: 'A25', replyToId: 'C04' },
  { id: 'C14', articleId: 'A25', replyToId: 'C13' },
  { id: 'C15', articleId: 'A21' },
  { id: 'C16', articleId: 'A21' },
  { id: 'C17', articleId: 'A21' },
  { id: 'C18', articleId: 'A21' },
  { id: 'C19', articleId: 'A01' },
  { id: 'C20', articleId: 'A01' },
  { id: 'C21', articleId: 'A02' },
  { id: 'C22', articleId: 'A03' },
  { id: 'C23', articleId: 'A04' },
  { id: 'C24', articleId: 'A05' },
  { id: 'C25', articleId: 'A06' },
  { id: 'C26', articleId: 'A07' },
  { id: 'C27', articleId: 'A08' },
  { id: 'C28', articleId: 'A09' },
];

// --- Utils Calculation Functions ---

const articleMarkdown = (articleId: string) => {
  const content = articleMarkdowns[articleId];
  if (!content) {
    throw new Error(`Missing markdown content for ${articleId}`);
  }
  const [firstLine] = content.split('\n');
  if (!firstLine.startsWith('# ')) {
    throw new Error(`Markdown content for ${articleId} must start with a H1 heading`);
  }
  const title = firstLine.replace(/^#\s+/, '').trim();
  return { title, content };
};

const articleExFields = (articleId: string) => {
  const path: IdPath = [];
  let currentId: string | undefined = articleId;
  while (currentId) {
    path.unshift(currentId);
    currentId = articleReplyPairs[currentId];
  }
  let replyCount = 0;
  for (const replyId in articleReplyPairs) {
    if (articleReplyPairs[replyId] === articleId) {
      replyCount += 1;
    }
  }
  let commentCount = 0;
  for (const relation of commentRelations) {
    if (relation.articleId === articleId) {
      commentCount += 1;
    }
  }
  return {
    path: encodeIdPath(path),
    replyCount,
    commentCount: commentCount,
    bookmarkCount: userBookmarks[articleId]?.length ?? 0,
    ...nextTimestamps(),
  };
};

const commentExFields = (commentId: string) => {
  const path: IdPath = [];
  let currentId: string | undefined = commentId;
  while (currentId) {
    path.unshift(currentId);
    currentId = commentRelations.find((c) => c.id === currentId)?.replyToId;
  }
  return {
    articleId: commentRelations.find((c) => c.id === commentId)!.articleId,
    path: encodeIdPath(path),
    ...nextTimestamps(),
  };
};

function buildTestDataset(): TestDataset {
  const users: UserSeed[] = [
    {
      id: userIds.author1,
      username: 'alice',
      name: 'Alice',
      aboutMe: 'Writes about engineering and design systems.',
      verifyCode: 'verify_alice',
      githubId: null,
      ...nextTimestamps(),
    },
    {
      id: userIds.author2,
      username: 'bob',
      name: 'Bob',
      aboutMe: 'Focuses on product insights and growth.',
      verifyCode: 'verify_bob',
      githubId: null,
      ...nextTimestamps(),
    },
    {
      id: userIds.reader1,
      username: 'carol',
      name: 'Carol',
      aboutMe: 'Enjoys reading long-form essays.',
      verifyCode: 'verify_carol',
      githubId: null,
      ...nextTimestamps(),
    },
    {
      id: userIds.reader2,
      username: 'dave',
      name: 'Dave',
      aboutMe: 'Reads and bookmarks external articles.',
      verifyCode: 'verify_dave',
      githubId: null,
      ...nextTimestamps(),
    },
    {
      id: userIds.reader3,
      username: 'frank',
      name: 'Frank',
      aboutMe: 'Prefers exploring new articles and bookmarks.',
      verifyCode: 'verify_frank',
      githubId: null,
      ...nextTimestamps(),
    },
    {
      id: userIds.invitedAuthor,
      username: 'erin',
      name: 'Erin',
      aboutMe: 'Invited author exploring markdown workflows.',
      verifyCode: 'verify_erin',
      githubId: null,
      ...nextTimestamps(),
    },
  ];

  const articles: ArticleSeed[] = [
    {
      id: 'A01',
      userId: userIds.author1,
      title: 'External Article 01',
      contentType: 'external',
      content: 'https://example.com/external/01',
      ...articleExFields('A01'),
    },
    {
      id: 'A02',
      userId: userIds.author1,
      title: 'External Article 02',
      contentType: 'external',
      content: 'https://example.com/external/02',
      ...articleExFields('A02'),
    },
    {
      id: 'A03',
      userId: userIds.author1,
      title: 'External Article 03',
      contentType: 'external',
      content: 'https://example.com/external/03',
      ...articleExFields('A03'),
    },
    {
      id: 'A04',
      userId: userIds.author1,
      title: 'External Article 04',
      contentType: 'external',
      content: 'https://example.com/external/04',
      ...articleExFields('A04'),
    },
    {
      id: 'A05',
      userId: userIds.author1,
      title: 'External Article 05',
      contentType: 'external',
      content: 'https://example.com/external/05',
      ...articleExFields('A05'),
    },
    {
      id: 'A06',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A06'),
      ...articleExFields('A06'),
    },
    {
      id: 'A07',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A07'),
      ...articleExFields('A07'),
    },
    {
      id: 'A08',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A08'),
      ...articleExFields('A08'),
    },
    {
      id: 'A09',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A09'),
      ...articleExFields('A09'),
    },
    {
      id: 'A10',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A10'),
      ...articleExFields('A10'),
    },
    {
      id: 'A11',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A11'),
      ...articleExFields('A11'),
    },
    {
      id: 'A12',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A12'),
      ...articleExFields('A12'),
    },
    {
      id: 'A13',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A13'),
      ...articleExFields('A13'),
    },
    {
      id: 'A14',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A14'),
      ...articleExFields('A14'),
    },
    {
      id: 'A15',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A15'),
      ...articleExFields('A15'),
    },
    {
      id: 'A16',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A16'),
      ...articleExFields('A16'),
    },
    {
      id: 'A17',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A17'),
      ...articleExFields('A17'),
    },
    {
      id: 'A18',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A18'),
      ...articleExFields('A18'),
    },
    {
      id: 'A19',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A19'),
      ...articleExFields('A19'),
    },
    {
      id: 'A20',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A20'),
      ...articleExFields('A20'),
    },
    {
      id: 'A21',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A21'),
      ...articleExFields('A21'),
    },
    {
      id: 'A22',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A22'),
      ...articleExFields('A22'),
    },
    {
      id: 'A23',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A23'),
      ...articleExFields('A23'),
    },
    {
      id: 'A24',
      userId: userIds.invitedAuthor,
      contentType: 'markdown',
      ...articleMarkdown('A24'),
      ...articleExFields('A24'),
    },
    {
      id: 'A25',
      userId: userIds.author1,
      contentType: 'markdown',
      ...articleMarkdown('A25'),
      ...articleExFields('A25'),
    },
    {
      id: 'A26',
      userId: userIds.author2,
      contentType: 'markdown',
      ...articleMarkdown('A26'),
      ...articleExFields('A26'),
    },
  ];

  const comments: CommentSeed[] = [
    {
      id: 'C01',
      ...commentExFields('C01'),
      userId: userIds.reader1,
      content: 'Great showcase of markdown features.',
    },
    {
      id: 'C02',
      ...commentExFields('C02'),
      userId: userIds.reader1,
      content: 'Appreciate the thorough examples.',
    },
    {
      id: 'C03',
      ...commentExFields('C03'),
      userId: userIds.reader2,
      content: 'The tables look crisp here.',
    },
    {
      id: 'C04',
      ...commentExFields('C04'),
      userId: userIds.reader1,
      content: 'Blockquotes read nicely.',
    },
    {
      id: 'C05',
      ...commentExFields('C05'),
      userId: userIds.author2,
      content: 'Thanks for sharing this draft.',
    },
    {
      id: 'C06',
      ...commentExFields('C06'),
      userId: userIds.reader1,
      content: 'The image scales well.',
    },
    {
      id: 'C07',
      ...commentExFields('C07'),
      userId: userIds.reader1,
      content: 'Lists and code blocks are solid.',
    },
    {
      id: 'C08',
      ...commentExFields('C08'),
      userId: userIds.reader1,
      content: 'Looking forward to more.',
    },
    {
      id: 'C09',
      ...commentExFields('C09'),
      userId: userIds.reader2,
      content: 'Replying to the first comment.',
    },
    {
      id: 'C10',
      ...commentExFields('C10'),
      userId: userIds.reader1,
      content: 'Thanks for the feedback!',
    },
    {
      id: 'C11',
      ...commentExFields('C11'),
      userId: userIds.author1,
      content: 'Glad it helps!',
    },
    {
      id: 'C12',
      ...commentExFields('C12'),
      userId: userIds.reader1,
      content: 'Adding more notes.',
    },
    {
      id: 'C13',
      ...commentExFields('C13'),
      userId: userIds.reader1,
      content: 'Nested reply testing.',
    },
    {
      id: 'C14',
      ...commentExFields('C14'),
      userId: userIds.reader2,
      content: 'Third-level reply check.',
    },
    {
      id: 'C15',
      ...commentExFields('C15'),
      userId: userIds.reader1,
      content: 'Thread kickoff comment.',
    },
    {
      id: 'C16',
      ...commentExFields('C16'),
      userId: userIds.reader1,
      content: 'Following up on the thread.',
    },
    {
      id: 'C17',
      ...commentExFields('C17'),
      userId: userIds.reader2,
      content: 'Replying with another view.',
    },
    {
      id: 'C18',
      ...commentExFields('C18'),
      userId: userIds.reader1,
      content: 'Closing thoughts on the thread.',
    },
    {
      id: 'C19',
      ...commentExFields('C19'),
      userId: userIds.reader1,
      content: 'Bookmark-worthy external link.',
    },
    {
      id: 'C20',
      ...commentExFields('C20'),
      userId: userIds.reader1,
      content: 'Second note on this link.',
    },
    {
      id: 'C21',
      ...commentExFields('C21'),
      userId: userIds.reader1,
      content: 'Short comment on article 02.',
    },
    {
      id: 'C22',
      ...commentExFields('C22'),
      userId: userIds.reader1,
      content: 'Short comment on article 03.',
    },
    {
      id: 'C23',
      ...commentExFields('C23'),
      userId: userIds.reader1,
      content: 'Short comment on article 04.',
    },
    {
      id: 'C24',
      ...commentExFields('C24'),
      userId: userIds.reader1,
      content: 'Short comment on article 05.',
    },
    {
      id: 'C25',
      ...commentExFields('C25'),
      userId: userIds.reader1,
      content: 'Short comment on article 06.',
    },
    {
      id: 'C26',
      ...commentExFields('C26'),
      userId: userIds.reader1,
      content: 'Short comment on article 07.',
    },
    {
      id: 'C27',
      ...commentExFields('C27'),
      userId: userIds.reader1,
      content: 'Short comment on article 08.',
    },
    {
      id: 'C28',
      ...commentExFields('C28'),
      userId: userIds.reader1,
      content: 'Short comment on article 09.',
    },
  ];

  const bookmarks = [];
  for (const articleId in userBookmarks) {
    const usersForArticle = userBookmarks[articleId];
    for (const userId of usersForArticle) {
      bookmarks.push({
        userId,
        articleId,
        createdAt: nextTime(),
      });
    }
  }

  const userRoles = [
    {
      userId: userIds.author1,
      roleKey: Role.ArticleAuthor,
      inviterId: null,
      invitedAt: nextTime(),
    },
    {
      userId: userIds.author2,
      roleKey: Role.ArticleAuthor,
      inviterId: null,
      invitedAt: nextTime(),
    },
    {
      userId: userIds.invitedAuthor,
      roleKey: Role.ArticleAuthor,
      inviterId: userIds.author1,
      invitedAt: nextTime(),
    },
  ];

  const inviteCodes = [
    {
      id: 1,
      code: 'INVITE_AUTHOR1_USED',
      roleKey: Role.ArticleAuthor,
      inviterId: userIds.author1,
      usedAt: nextTime(),
    },
    {
      id: 2,
      code: 'INVITE_AUTHOR2_USED',
      roleKey: Role.ArticleAuthor,
      inviterId: userIds.author2,
      usedAt: nextTime(),
    },
    {
      id: 3,
      code: 'INVITE_AUTHOR1_UNUSED',
      roleKey: Role.ArticleAuthor,
      inviterId: userIds.author1,
      usedAt: null,
    },
    {
      id: 4,
      code: 'INVITE_AUTHOR2_UNUSED',
      roleKey: Role.ArticleAuthor,
      inviterId: userIds.author2,
      usedAt: null,
    },
  ];

  return { users, articles, comments, bookmarks, userRoles, inviteCodes };
}

export const testDataset = buildTestDataset();
export function getAuthor(article: ArticleSeed): UserSeed {
  const author = testDataset.users.find((user) => user.id === article.userId);
  if (!author) {
    throw new Error(`Author not found for article ${article.id}`);
  }
  return author;
}
