import { preprocessMeltUI, sequence } from '@melt-ui/pp';
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config}*/
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    // See https://kit.svelte.dev/docs/adapter-cloudflare
    adapter: adapter({
      config: "wrangler.toml",
      routes: {
        include: ['/*'],
        exclude: ['<all>'],
      },
      platformProxy: {
        configPath: 'wrangler.toml',
        environment: undefined,
        experimentalJsonConfig: false,
        persist: true,
      },
    }),
  },
};
export default config;
