/**
 * Electron test fixture — launches the built app and provides
 * a Playwright page connected to the Electron BrowserWindow.
 */

import { test as base, expect, type Page } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';

let electronApp: ElectronApplication | null = null;

export type ElectronTest = {
  page: Page;
  app: ElectronApplication;
};

// Extend base test with Electron app fixture
export const test = base.extend<ElectronTest>({
  page: async ({}, use) => {
    // Launch Electron with the built main.js
    // Use the dev build if the release doesn't exist
    const mainJs = path.join(process.cwd(), 'dist/main/main.js');
    
    electronApp = await electron.launch({
      args: [mainJs],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Wait for the first window
    const page = await electronApp.firstWindow();
    
    // Wait for the renderer to load
    await page.waitForLoadState('domcontentloaded');
    
    await use(page);
    
    await electronApp.close();
    electronApp = null;
  },
});

export { expect };
