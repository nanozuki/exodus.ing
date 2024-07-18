import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { matter } from 'vfile-matter';

import type { Root } from 'mdast';
import type { VFile } from 'vfile';

interface FileData {
	matter?: Record<string, unknown>;
	meta?: { title?: string };
}

export type File = VFile & { data: FileData };

function remarkMeta() {
	return function (tree: Root, file: File) {
		matter(file);
		if (file.data.matter && file.data.matter.title && typeof file.data.matter.title === 'string') {
			file.data.meta = { title: file.data.matter.title };
			return;
		}
		for (const node of tree.children) {
			if (node.type === 'heading' && node.depth === 1) {
				const textContent = node.children
					.filter((child) => child.type === 'text')
					.map((child) => child.value)
					.join('');
				file.data.meta = { title: textContent };
				return;
			}
		}
	};
}

export const compile = async (article: string): Promise<File> => {
	return await unified()
		.use(remarkParse)
		.use(remarkFrontmatter)
		.use(remarkMeta)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSanitize)
		.use(rehypeStringify)
		.process(article);
};
