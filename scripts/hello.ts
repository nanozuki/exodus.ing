// This file is an example of running script in project.
// To run this file, use the command:
// ```sh
// pnpm dlx ts-node scripts/hello.ts
// ```
import { compileMarkdown } from '../src/lib/markdown';

const md = '# Hello World';

const html = await compileMarkdown(md);
console.log(html);

export {};
