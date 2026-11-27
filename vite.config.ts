import { readFile } from 'node:fs/promises';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// Reads the view from disk on every request so a regenerated view shows on reload. The name pattern keeps requests
// inside `.contracts/`.
const serveContractViews = (): Plugin => ({
  name: 'serve-contract-views',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/contracts', async (req, res, next) => {
      const path = req.url?.split('?')[0] ?? '/';
      const name = path === '/' ? 'contracts' : /^\/([\w-]+)(?:\.html)?$/.exec(path)?.[1];
      if (!name) return next();

      try {
        const html = await readFile(new URL(`./.contracts/${name}.html`, import.meta.url));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      } catch {
        next();
      }
    });
  },
});

/**
 * Builds with Tailwind, SvelteKit (Vite preprocessing, the Node adapter, experimental remote functions, and async
 * components), and auto-installed Svelte icons, emitting sourcemaps. The dev server also serves each contract view
 * `.contracts/<name>.html` at `/contracts/<name>`, and `contracts.html` at `/contracts`. Every test must make an
 * assertion. The `client` project runs `*.svelte.{test,spec}` files in headless Chromium, excluding
 * `src/lib/server`; the `server` project runs the other `src` test and spec files, including repository integration
 * and use-case unit tests, in Node, with timeouts that cover local database provisioning. `vitest-setup-client.ts` is
 * not registered as a setup file.
 */
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
    serveContractViews(),
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
