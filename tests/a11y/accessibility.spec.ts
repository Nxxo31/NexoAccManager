import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';
import { _electron as electron } from 'playwright';
import type { ElectronApplication, Page } from 'playwright';
import path from 'path';

test.describe.configure({ mode: 'serial' });

test.describe('Accessibility Tests with axe-core', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await injectAxe(page);
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test.beforeEach(async () => {
    // Ensure we start from the Accounts tab
    await page.waitForSelector('nav a[href="/accounts"]', { timeout: 10000 });
  });

  test('Sidebar has no critical accessibility violations', async () => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await checkA11y(sidebar, {
      includedImpacts: ['critical', 'serious'],
    });
  });

  test('Accounts page (empty state) has no critical accessibility violations', async () => {
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    const mainContent = page.locator('main, [class*="flex-1"], [class*="content"]');
    await expect(mainContent.first()).toBeVisible();
    await checkA11y(mainContent.first(), {
      includedImpacts: ['critical', 'serious'],
    });
  });

  test('AddAccountModal has no critical accessibility violations when open', async () => {
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    const addAccountBtn = page.locator('button:has-text("Agregar Cuenta")');
    await addAccountBtn.click();

    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await checkA11y(modal, {
      includedImpacts: ['critical', 'serious'],
    });

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('Settings page has no critical accessibility violations', async () => {
    const settingsLink = page.locator('nav a[href="/settings"]');
    await settingsLink.click();
    await page.waitForTimeout(500);

    const settingsContent = page.locator('main, [class*="flex-1"], [class*="content"]');
    await expect(settingsContent.first()).toBeVisible();
    await checkA11y(settingsContent.first(), {
      includedImpacts: ['critical', 'serious'],
    });
  });

  test('Servers page has no critical accessibility violations', async () => {
    const serversLink = page.locator('nav a[href="/servers"]');
    await serversLink.click();
    await page.waitForTimeout(500);

    const serversContent = page.locator('main, [class*="flex-1"], [class*="content"]');
    await expect(serversContent.first()).toBeVisible();
    await checkA11y(serversContent.first(), {
      includedImpacts: ['critical', 'serious'],
    });
  });

  test('Presence page has no critical accessibility violations', async () => {
    const presenceLink = page.locator('nav a[href="/presence"]');
    await presenceLink.click();
    await page.waitForTimeout(500);

    const presenceContent = page.locator('main, [class*="flex-1"], [class*="content"]');
    await expect(presenceContent.first()).toBeVisible();
    await checkA11y(presenceContent.first(), {
      includedImpacts: ['critical', 'serious'],
    });
  });
});
