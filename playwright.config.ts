import { defineConfig } from '@playwright/test';
import { acquireSuiteLock } from './e2e/support/suite-lock';

acquireSuiteLock();

export default defineConfig({
  globalSetup: './e2e/support/global-setup.ts',
  reporter: 'list',
  testDir: 'e2e',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 60_000,
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
});
