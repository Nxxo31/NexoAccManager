/**
 * Playwright E2E config for Electron desktop testing.
 * Launches the built .exe (or dev electron) and runs tests against the real app.
 */

import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests/e2e-electron',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    trace: 'on-first-retry',
  },
  // Electron tests don't use a browser server — the fixture handles launch
  projects: [
    {
      name: 'electron',
      use: {
        // Custom fixture will handle launching Electron
        // Add metadata for the test fixture
      },
    },
  ],
});
