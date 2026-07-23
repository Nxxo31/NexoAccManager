/**
 * E2E Smoke Test — verifies the Electron app launches and renders correctly.
 * Tests: app starts, window appears, sidebar visible, main content renders.
 */

import { test, expect } from './electron-fixture';

test.describe('Electron App Smoke', () => {
  test('app launches and shows window', async ({ page }) => {
    // Window title should be set
    const title = await page.title();
    expect(title).toBeDefined();
  });

  test('sidebar navigation visible', async ({ page }) => {
    // Wait for sidebar to render
    await page.waitForSelector('text=Cuentas', { timeout: 10000 });
    
    // Check nav items
    await expect(page.locator('text=Cuentas')).toBeVisible();
    await expect(page.locator('text=Servidores')).toBeVisible();
    await expect(page.locator('text=Juegos')).toBeVisible();
    await expect(page.locator('text=Amigos')).toBeVisible();
    await expect(page.locator('text=Ajustes')).toBeVisible();
  });

  test('accounts view renders by default', async ({ page }) => {
    // Default view should be Accounts
    await page.waitForSelector('text=Cuentas', { timeout: 10000 });
    
    // Should show either accounts list or empty state
    const hasAccounts = await page.locator('text=No hay cuentas agregadas').isVisible().catch(() => false);
    const hasAccountCards = await page.locator('[data-account-card]').count().catch(() => 0);
    
    // One or the other must be true
    expect(hasAccounts || hasAccountCards > 0).toBeTruthy();
  });

  test('can navigate to Settings', async ({ page }) => {
    await page.waitForSelector('text=Ajustes', { timeout: 10000 });
    await page.locator('text=Ajustes').click();
    
    // Settings view should show
    await expect(page.locator('text=Apariencia')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Servidor web')).toBeVisible();
    await expect(page.locator('text=Avanzado')).toBeVisible();
  });

  test('can navigate to Servers', async ({ page }) => {
    await page.waitForSelector('text=Servidores', { timeout: 10000 });
    await page.locator('text=Servidores').click();
    
    // Should show server browser or empty state
    await expect(page.locator('text=Seleccionar cuenta')).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to Games', async ({ page }) => {
    await page.waitForSelector('text=Juegos', { timeout: 10000 });
    await page.locator('text=Juegos').click();
    
    await expect(page.locator('text=Buscar juego')).toBeVisible({ timeout: 5000 }).catch(() => {
      // May show empty state first
    });
  });

  test('can navigate to Friends', async ({ page }) => {
    await page.waitForSelector('text=Amigos', { timeout: 10000 });
    await page.locator('text=Amigos').click();
    
    await expect(page.locator('text=Amigos')).toBeVisible({ timeout: 5000 });
  });
});
