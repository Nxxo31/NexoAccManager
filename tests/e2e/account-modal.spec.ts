import { test, expect } from '@playwright/test';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';
import path from 'path';

test.describe('Add Account Modal', () => {
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
  });

  test.afterAll(async () => {
    if (electronApp) await electronApp.close();
  });

  test('should open Add Account modal and show browser login option', async () => {
    // Wait for app to load on Accounts tab
    await page.waitForSelector('nav a[href="/accounts"]', { timeout: 10000 });
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    // Click the Add Account button in the ActionBar
    const addAccountBtn = page.locator('button:has-text("Agregar Cuenta")');
    await expect(addAccountBtn).toBeVisible({ timeout: 5000 });
    await addAccountBtn.click();

    // Wait for modal to appear — it uses framer-motion AnimatePresence
    const modal = page.locator('[role="dialog"], [class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check for browser login option (Globe icon + "Iniciar sesión en Roblox")
    const browserLoginText = modal.locator('text=Iniciar sesión en Roblox');
    await expect(browserLoginText).toBeVisible({ timeout: 3000 });

    // Check for the group field
    const groupInput = modal.locator('input[placeholder="Default"]');
    await expect(groupInput).toBeVisible({ timeout: 3000 });

    // Check for the browser login button (the main CTA)
    const browserLoginBtn = modal.locator('button:has-text("Iniciar sesión en Roblox")');
    await expect(browserLoginBtn).toBeVisible({ timeout: 3000 });

    // Check for advanced options toggle
    const advancedToggle = modal.locator('text=Opciones avanzadas');
    await expect(advancedToggle).toBeVisible({ timeout: 3000 });

    // Click advanced to expand cookie input
    await advancedToggle.click();
    await page.waitForTimeout(500);

    // Check for manual cookie textarea
    const cookieInput = modal.locator('textarea[placeholder*="cookie" i]');
    await expect(cookieInput).toBeVisible({ timeout: 3000 });

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('should close modal via backdrop click', async () => {
    // Navigate to Accounts
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    // Open modal
    const addAccountBtn = page.locator('button:has-text("Agregar Cuenta")');
    await addAccountBtn.click();

    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click the backdrop (the outer container with bg-black/50)
    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('should close modal via close button', async () => {
    // Navigate to Accounts
    const accountsLink = page.locator('nav a[href="/accounts"]');
    await accountsLink.click();
    await page.waitForTimeout(500);

    // Open modal
    const addAccountBtn = page.locator('button:has-text("Agregar Cuenta")');
    await addAccountBtn.click();

    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click the X close button (has aria-label="Cerrar" after a11y improvements, or just the X icon)
    const closeBtn = modal.locator('button').filter({ has: page.locator('svg') }).first();
    await closeBtn.click();
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});
