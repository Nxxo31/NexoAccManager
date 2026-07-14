import { defineConfig, devices } from '@playwright/test';

// Playwright config for browser-based E2E and visual regression tests.
// Runs against the Vite dev server in BROWSER_ONLY mode (no Electron).
// This allows tests to run in WSL, CI, and any headless environment.
//
// Prerequisite: Start the dev server first:
//   npm run dev:browser
// Then run tests:
//   npx playwright test --config playwright.browser.config.ts

export default defineConfig({
  testDir: './tests',
  testMatch: [
    '**/e2e-browser/**/*.spec.ts',
    '**/visual/**/*.spec.ts',
    '**/a11y-browser/**/*.spec.ts',
  ],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
    // Visual regression — compare screenshots
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,  // 1% tolerance for anti-aliasing/font differences
      threshold: 0.2,
    },
  },
  // CRITICAL: screenshots enabled (unlike electron config which had ignoreSnapshots: true)
  ignoreSnapshots: false,
  reporter: [
    ['html'],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/e2e-browser/**/*.spec.ts',
        '**/visual/**/*.spec.ts',
        '**/a11y-browser/**/*.spec.ts',
      ],
    },
  ],
  // Auto-start dev server if not running
  webServer: {
    command: 'npm run dev:browser',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30 * 1000,
  },
});
