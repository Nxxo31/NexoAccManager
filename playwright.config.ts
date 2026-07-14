import { defineConfig, devices } from '@playwright/test';
import { ElectronApplication, _electron } from 'playwright';

// Reference: https://playwright.dev/docs/test-electron
export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  ignoreSnapshots: true,
  reporter: 'html',
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    // For electron, we don't need a base URL because we launch the electron app.
    // But we can set it to empty string.
    baseURL: '',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Electron',
      testMatch: '**/*.spec.ts',
      use: {
        // We'll launch Electron via the launchProject function in each test file.
      },
    },
  ],
});