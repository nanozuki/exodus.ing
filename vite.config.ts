import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      compilerOptions: { experimental: { async: true } },
      adapter: adapter(),
      experimental: { remoteFunctions: true },
    }),
    Icons({ compiler: 'svelte', autoInstall: true }),
  ],
  build: { sourcemap: true },
  test: {
    expect: { requireAssertions: true },

    projects: [
      {
        extends: './vite.config.ts',

        test: {
          name: 'client',

          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },

          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
        },
      },

      {
        extends: './vite.config.ts',

        test: {
          name: 'server',
          testTimeout: 30_000,
          hookTimeout: 120_000,
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
});
