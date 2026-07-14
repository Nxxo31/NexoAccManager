import { test, expect } from '@playwright/test';

// VISUAL REGRESSION TESTS — comparan cada vista contra un baseline.
// Para regenerar: npx playwright test --update-snapshots --config playwright.browser.config.ts

test.describe('Visual regression — screenshots de cada vista', () => {
  test('vista de cuentas vacía', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('accounts-empty.png', {
      fullPage: true,
    });
  });

  test('header aislado', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('header.png');
  });

  test('nav bar aislada', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Nav bar = the bar with Place ID / Job ID / Servers / Join
    const navBar = page.locator('text=Place ID').locator('..').locator('..');
    await expect(navBar).toBeVisible();
    await expect(navBar).toHaveScreenshot('nav-bar.png');
  });

  test('action bar aislada', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Action bar = the bottom bar containing Eliminar, Abrir App, Control, Follow
    const actionBar = page.locator('button:has-text("Eliminar")').locator('..').locator('..');
    await expect(actionBar).toBeVisible();
    await expect(actionBar).toHaveScreenshot('action-bar.png');
  });

  test('modal Servers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Fill Place ID to enable Servers button
    await page.locator('input[placeholder*="5315046213"]').fill('5315046213');
    await page.waitForTimeout(200);

    await page.locator('button:has-text("Servers")').click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    const modal = page.locator('[class*="fixed inset-0"]').last();
    await expect(modal).toBeVisible({ timeout: 5000 });

    await expect(modal).toHaveScreenshot('servers-modal.png');
  });

  test('modal Ajustes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Ajustes")').click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    const modal = page.locator('[class*="fixed inset-0"]').last();
    await expect(modal).toBeVisible({ timeout: 5000 });

    await expect(modal).toHaveScreenshot('settings-modal.png');
  });

  test('modal agregar cuenta', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Click "Agregar" button in action bar
    await page.locator('button:has-text("Agregar")').first().click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('add-account-modal.png', {
      fullPage: true,
    });
  });
});
