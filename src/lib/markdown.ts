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
import { AppError } from '$lib/errors';

export interface MarkdownMeta {
  title: string;
  titleSource: 'heading' | 'frontmatter';
}

export type ArticleCompileResult =
  | { ok: true; value: Value; meta: MarkdownMeta }
  | { ok: false; error: AppError };

interface FileData {
  matter?: Record<string, unknown>;
  meta?: MarkdownMeta;
}

type File = VFile & { data: FileData };

function remarkMeta() {
  return function (tree: Root, file: File) {
    matter(file);
    if (file.data.matter && file.data.matter.title && typeof file.data.matter.title === 'string') {
      file.data.meta = {
        title: file.data.matter.title,
        titleSource: 'frontmatter',
      };
      return;
    }
    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 1) {
        const textContent = node.children
          .filter((child) => child.type === 'text')
          .map((child) => child.value)
          .join('');
        file.data.meta = {
          title: textContent,
          titleSource: 'heading',
        };
        return;
      }
    }
  };
}

export const compileArticle = async (article: string): Promise<ArticleCompileResult> => {
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
  if (!file.data.meta) {
    return { ok: false, error: AppError.InvalidMarkdownError('No title found') };
  }
  return { ok: true, value: file.value, meta: file.data.meta };
};

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
