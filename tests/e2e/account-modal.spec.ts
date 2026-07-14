import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Add Account Modal', () => {
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

  test('should open Add Account modal and show browser login option', async () => {
    await page.waitForSelector('nav a[href="/accounts"]', { timeout: 10000 });
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    const addAccountBtn = page.locator('button:has-text("Agregar Cuenta")');
    await expect(addAccountBtn).toBeVisible({ timeout: 5000 });
    await addAccountBtn.click();

    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const browserLoginText = modal.locator('text=Iniciar sesión en Roblox');
    await expect(browserLoginText).toBeVisible({ timeout: 3000 });

    const groupInput = page.locator('input[placeholder="Default"]');
    await expect(groupInput).toBeVisible({ timeout: 3000 });

    const browserLoginBtn = modal.locator('button:has-text("Iniciar sesión en Roblox")');
    await expect(browserLoginBtn).toBeVisible({ timeout: 3000 });

    const advancedToggle = modal.locator('text=Opciones avanzadas');
    await expect(advancedToggle).toBeVisible({ timeout: 3000 });

    await advancedToggle.click();
    await page.waitForTimeout(500);

    const cookieInput = modal.locator('textarea[placeholder*="cookie" i]');
    await expect(cookieInput).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('should close modal via backdrop click', async () => {
    await page.waitForSelector('nav a[href="/accounts"]', { timeout: 10000 });
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    const addAccountBtn = page.locator('button:has-text("Agregar Cuenta")');
    await addAccountBtn.click();

    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('should close modal via close button', async () => {
    await page.waitForSelector('nav a[href="/accounts"]', { timeout: 10000 });
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    const addAccountBtn = page.locator('button:has-text("Agregar Cuenta")');
    await addAccountBtn.click();

    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const closeBtn = modal.locator('button').filter({ has: page.locator('svg') }).first();
    await closeBtn.click();
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});