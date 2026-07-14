import { test, expect } from '@playwright/test';

// VISUAL REGRESSION TESTS — comparan cada vista contra un baseline.
// Si algo cambia visualmente, el test falla con un diff.
// Para generar baselines: npx playwright test --update-snapshots --config playwright.browser.config.ts
// Para validar: npx playwright test --config playwright.browser.config.ts

test.describe('Visual regression — screenshots de cada vista', () => {
  test('vista de cuentas vacía', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // estabilizar animaciones y fonts

    // Esperar que fonts carguen para screenshot estable
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('accounts-empty.png', {
      fullPage: true,
    });
  });

  test('sidebar aislado', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toHaveScreenshot('sidebar.png');
  });

  test('action bar aislada', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // La action bar está en la parte inferior
    const actionBar = page.locator('text=v2.3.1').locator('..');
    await expect(actionBar).toHaveScreenshot('action-bar.png');
  });

  test('vista de servers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('a[href="/servers"]').click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('servers.png', {
      fullPage: true,
    });
  });

  test('vista de presencia', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('a[href="/presence"]').click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('presence.png', {
      fullPage: true,
    });
  });

  test('vista de ajustes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('a[href="/settings"]').click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('settings.png', {
      fullPage: true,
    });
  });

  test('modal agregar cuenta', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Agregar Cuenta")').click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('add-account-modal.png', {
      fullPage: true,
    });
  });
});
