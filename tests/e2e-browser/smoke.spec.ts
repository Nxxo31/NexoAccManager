import { test, expect } from '@playwright/test';

// SMOKE TESTS — validan que la app renderiza sin errores en navegador real.
// v2.4.0 Layout: header (logo + Ocultar + Ajustes) → table → dock (PlaceID/JobID/Shuffle + action buttons).

test.describe('Smoke tests — la app carga sin errores', () => {
  test('no hay error overlay de Vite', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const errorOverlay = page.locator('vite-error-overlay, .vite-error-overlay');
    await expect(errorOverlay).not.toBeVisible();

    const errorFallback = page.locator('text=Error iniciando NexoAccManager');
    await expect(errorFallback).not.toBeVisible();
  });

  test('el div#root tiene contenido real', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    const rootHTML = await root.innerHTML();
    expect(rootHTML.length).toBeGreaterThan(100);
  });

  test('header visible con logo y botones', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // v2.4.0: header has NexoAcc logo, 0/50 counter, Ocultar checkbox, Ajustes button
    const logo = page.locator('header').locator('text=Nexo');
    await expect(logo).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('checkbox', { name: 'Ocultar' })).toBeVisible();
    await expect(page.locator('header button[aria-label="Cambiar tema"]')).toBeVisible();
  });

  test('dock visible con Place ID y Job ID', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Dock has Place ID and Job ID labels
    await expect(page.locator('label:has-text("Place ID")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('label:has-text("Job ID")')).toBeVisible();
  });

  test('action bar visible con botones agrupados', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // v2.4.0 Dock: Agregar, Eliminar, Abrir App
    await expect(page.locator('button:has-text("Agregar")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Eliminar")')).toBeVisible();
    await expect(page.locator('button:has-text("Abrir App")')).toBeVisible();
  });

  test('consola no tiene errores críticos', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out all window.api related errors (expected in browser mode)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('window.api') &&
        !err.includes('api is undefined') &&
        !err.includes('Cannot read properties of undefined') &&
        !err.includes('api.settings') &&
        !err.includes('api.account') &&
        !err.includes('api.theme') &&
        !err.includes('api.language') &&
        !err.includes('api.roblox') &&
        !err.includes('api.advanced') &&
        !err.includes('api.cookieEvents') &&
        !err.includes('Cannot destructure property') &&
        !err.includes('Failed to fetch dynamically imported module') &&
        !err.includes('Error: <path> attribute d: Expected arc flag')
    );

    expect(criticalErrors).toEqual([]);
  });
});
