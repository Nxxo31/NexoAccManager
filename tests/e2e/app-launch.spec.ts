import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import type { ElectronApplication, Page } from 'playwright';
import path from 'path';

// Skip Electron tests on non-Windows platforms since they require GUI
test.describe.skip(process.platform !== 'win32', 'Electron GUI tests require Windows environment', () => {
    let electronApp: Electron.Application;
    let page: Page;

    test.beforeAll(async () => {
      electronApp = await electron.launch({
        args: ['.', '--no-sandbox'],
        env: {
          ...process.env,
          NODE_ENV: 'test',
          ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
        },
        cwd: path.join(__dirname, '../../'),
      });
      page = await electronApp.firstWindow();
      await page.waitForLoadState('domcontentloaded');
    });

    test.afterAll(async () => {
      if (electronApp) await electronApp.close();
    });

    test('should launch without black screen', async () => {
      await page.waitForSelector('aside, nav, [class*="sidebar"]', { timeout: 10000 });
      const isVisible = await page.isVisible('body');
      expect(isVisible).toBeTruthy();

      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(0);

      const logo = page.locator('text=Nexo');
      await expect(logo).toBeVisible({ timeout: 5000 });
    });

    test('should show Accounts tab as default route', async () => {
      await page.waitForSelector('nav a[href="/accounts"]', { timeout: 10000 });
      const accountsLink = page.locator('nav a[href="/accounts"]');
      await expect(accountsLink).toBeVisible();

      const accountsContent = page.locator('table, [class*="empty"], text=Agregar Cuenta, text=No hay cuentas');
      await expect(accountsContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to Servers tab', async () => {
      const serversLink = page.locator('nav a[href="/servers"]');
      await serversLink.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveURL(/\/servers/);

      const serversContent = page.locator('input[placeholder*="Place"], input[placeholder*="place"], text=Server, [class*="server"]');
      await expect(serversContent.first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to Presence tab', async () => {
      const presenceLink = page.locator('nav a[href="/presence"]');
      await presenceLink.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveURL(/\/presence/);

      const presenceContent = page.locator('text=Presencia, text=Online, text=Offline, [class*="presence"]');
      await expect(presenceContent.first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to Settings tab', async () => {
      const settingsLink = page.locator('nav a[href="/settings"]');
      await settingsLink.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveURL(/\/settings/);

      const settingsContent = page.locator('text=Ajustes, text=Configuración, text=Tema, [class*="setting"]');
      await expect(settingsContent.first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate back to Accounts and show ActionBar', async () => {
      const accountsLink = page.locator('nav a[href="/accounts"]');
      await accountsLink.click();
      await page.waitForTimeout(500);

      const actionBar = page.locator('button:has-text("Agregar Cuenta"), button:has-text("Añadir")');
      await expect(actionBar.first()).toBeVisible({ timeout: 5000 });
    });
  });
});