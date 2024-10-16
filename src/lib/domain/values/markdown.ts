import { compile } from '$lib/markdown';
import { type Value } from 'vfile';

export interface MarkdownMeta {
  title?: string;
  titleSource?: 'heading' | 'frontmatter';
}

export type MarkdownError = 'NoTitle';

export type MarkdownCompileResult =
  | { success: true; value: Value; meta: MarkdownMeta }
  | { success: false; errors: MarkdownError[] };

export async function compileMarkdown(article: string): Promise<MarkdownCompileResult> {
  const file = await compile(article);
  if (file.data.meta && file.data.meta.title) {
    return { success: true, value: file.value, meta: file.data.meta };
  }
  return { success: false, errors: ['NoTitle'] };
}
