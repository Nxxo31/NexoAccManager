import { test, expect } from '@playwright/test';

// VISUAL REGRESSION TESTS — v2.4.0 layout.
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

  test('dock bar aislada', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Dock = container with Place ID label
    const dockBar = page.locator('text=Place ID').locator('..').locator('..');
    await expect(dockBar).toBeVisible();
    await expect(dockBar).toHaveScreenshot('dock-bar.png');
  });

  test('modal Ajustes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('header button[aria-label="Cambiar tema"]').click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await expect(modal).toHaveScreenshot('settings-modal.png');
  });

  test('modal agregar cuenta', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Agregar")').first().click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('add-account-modal.png', {
      fullPage: true,
    });
  });
});
