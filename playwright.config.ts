import { defineConfig } from '@playwright/test';

const host = 'http://localhost:4173';

export default defineConfig({
  webServer: {
    command: 'pnpm run preview',
    url: host,
    env: {
      ...process.env,
      EXODUSING_HOST: host,
    },
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'e2e',
  use: {
    baseURL: host,
  },
});
