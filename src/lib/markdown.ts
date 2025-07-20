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

export type CompiledArticle = { value: Value; title: string };

interface FileData {
  matter?: Record<string, unknown>;
  title?: string;
}

type File = VFile & { data: FileData };

function remarkMeta() {
  return function (tree: Root, file: File) {
    matter(file);
    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 1) {
        const textContent = node.children
          .filter((child) => child.type === 'text')
          .map((child) => child.value)
          .join('');
        file.data.title = textContent;
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
  if (!file.data.title) {
    throwError('PARAMETER_INVALID', { title: '标题不能为空' });
  }
  return { value: file.value, title: file.data.title };
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
