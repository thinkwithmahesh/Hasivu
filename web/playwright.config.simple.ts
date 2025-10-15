import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright Configuration for HASIVU Test Recovery
 * Purpose: Minimal config to get tests running and validate authentication fixes
 */

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [['html', { outputDir: 'test-results/html-report', open: 'never' }], ['list']],

  outputDir: 'test-results/artifacts',

  use: {
    baseURL: 'http://localhost:3000',
    headless: !!process.env.CI,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
      testDir: './tests',
      testMatch: ['**/*.spec.ts'],
    },
  ],
});
