import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Flat config combining the recommended JavaScript and TypeScript rules with the Prettier-compatible Svelte rules,
 * browser and Node globals, and the TypeScript parser for Svelte files. Build output, `.svelte-kit/`, `dist/`, and
 * `node_modules/` are ignored.
 */
export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/'],
  },
];
