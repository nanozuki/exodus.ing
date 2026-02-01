import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { matter } from 'vfile-matter';
import type { Root } from 'mdast';
import type { VFile, Value } from 'vfile';
import { throwError } from '$lib/errors';

interface FileData {
  matter?: Record<string, unknown>;
  title?: string;
}

type File = VFile & { data: FileData };

export const compileMarkdown = async (content: string): Promise<Value> => {
  if (content.length === 0) {
    return '';
  }
  const file: File = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(content);
  return file.value;
};

export enum MarkdownArticleIssue {
  MissingTitle = 'MissingTitle',
}

type IssueMessage = {
  title: string;
  description: string;
};

export const articleIssueMessages: Record<MarkdownArticleIssue, IssueMessage> = {
  [MarkdownArticleIssue.MissingTitle]: {
    title: '缺少标题',
    description: '标题为第一个一级标题',
  },
};

export function throwArticleIssue(issue: MarkdownArticleIssue, field: string): never {
  return throwError('PARAMETER_INVALID', {
    [field]: articleIssueMessages[issue].title,
  });
}

export type CompiledArticle = {
  markup: string;
  title: string;
  issues: MarkdownArticleIssue[];
};

function remarkMeta() {
  return function (tree: Root, file: File) {
    matter(file);
    // Find the first level 1 heading as the title, remove it and everything before it
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (node.type === 'heading' && node.depth === 1) {
        const textContent = node.children
          .filter((child) => child.type === 'text')
          .map((child) => child.value)
          .join('');
        file.data.title = textContent;
        tree.children = tree.children.slice(i + 1);
        return;
      }
    }
  };
}

export const compileArticle = async (article: string): Promise<CompiledArticle> => {
  const file: File = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkMeta)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(article);
  const issues: MarkdownArticleIssue[] = [];
  if (!file.data.title) {
    issues.push(MarkdownArticleIssue.MissingTitle);
  }
  return { markup: file.value.toString(), title: file.data.title || '', issues };
};
