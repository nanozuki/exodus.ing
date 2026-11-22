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
import { throwError } from './errors';

interface FileData {
  matter?: Record<string, unknown>;
  title?: string;
}

type File = VFile & { data: FileData };

/**
 * Renders Markdown to sanitized HTML: parses YAML frontmatter (not rendered), GFM, and raw HTML, then sanitizes with
 * the default rehype-sanitize policy. The first H1 stays in the output, unlike `compileArticle`. Empty input returns an
 * empty string; parser and processor failures reject.
 */
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

/** The title and description shown for each article issue. */
export const articleIssueMessages: Record<MarkdownArticleIssue, IssueMessage> = {
  [MarkdownArticleIssue.MissingTitle]: {
    title: '缺少标题',
    description: '标题为第一个一级标题',
  },
};

/** Throws PARAMETER_INVALID on `field` with the issue's title as the message. */
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
    // Article pages render the title separately; the body starts after the first H1.
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

/**
 * Compiles an article like `compileMarkdown`, taking its title from the first top-level H1. The title joins only that
 * heading's direct text children, so inline formatting such as emphasis or code is left out. The heading and every node
 * before it are removed from `markup`. A missing or empty title yields the `MissingTitle` issue and an empty `title`.
 */
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
