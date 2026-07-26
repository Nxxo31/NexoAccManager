/**
 * Electron test fixture — launches the built app and provides
 * a Playwright page connected to the Electron BrowserWindow.
 *
 * Requisitos:
 *  - dist/main/main.js debe existir (npm run build previo)
 *  - xvfb-run en Linux/WSL sin display
 */

import { test as base, expect, type Page } from '@playwright/test';
import { _electron as electron, type ElectronApplication } from 'playwright';
import path from 'node:path';

let electronApp: ElectronApplication | null = null;

export type ElectronTest = {
  page: Page;
  app: ElectronApplication;
};

// Extiende el test base con el fixture de Electron
export const test = base.extend<ElectronTest>({
  page: async ({}, use) => {
    const mainJs = path.join(process.cwd(), 'dist/main/main.js');

    electronApp = await electron.launch({
      args: [mainJs, '--no-sandbox'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
      },
    });

    // Espera la primera ventana
    const page = await electronApp.firstWindow();

    // DOMContentLoaded + networkidle para Mantine async
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    await use(page);

    await electronApp.close();
    electronApp = null;
  },
});

export { expect };
