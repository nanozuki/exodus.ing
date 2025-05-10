import { preprocessMeltUI, sequence } from '@melt-ui/pp';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: { adapter: adapter() },
};

export default config;
