import { defineConfig } from '@playwright/test';
import { acquireSuiteLock } from './e2e/support/suite-lock';

// playwright.config.ts acquires the E2E suite lock when evaluated, before Playwright clears test output.

acquireSuiteLock();

/**
 * Runs the e2e tests fully parallel on two workers, without retries, with a 60-second timeout and global setup. Failed
 * tests keep their traces and screenshots. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, when set, selects the Chromium
 * binary. There is no shared web server; fixtures start a deployment per test.
 */
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
