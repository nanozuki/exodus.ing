import { defineConfig } from '@playwright/test';

const host = 'http://localhost:4173';

export default defineConfig({
  webServer: {
    command: 'pnpm run build && pnpm run preview',
    url: host,
    env: {
      ...process.env,
      APP_URL: host,
    },
    reuseExistingServer: false,
  },
  testDir: 'e2e',
  use: {
    baseURL: host,
  },
});
