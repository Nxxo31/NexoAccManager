import { test, expect } from '@playwright/test';

// SMOKE TESTS — validan que la app renderiza sin errores en navegador real.
// Layout: header (logo + Ocultar + Ajustes) → table → nav bar → action bar.

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

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    const rootHTML = await root.innerHTML();
    expect(rootHTML.length).toBeGreaterThan(100);
  });

  test('header visible con logo y botones', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const logo = page.locator('text=NexoAcc');
    await expect(logo).toBeVisible({ timeout: 10000 });

    // Header has Ocultar checkbox and Ajustes button — NO Servers or Presencia
    await expect(page.getByRole('checkbox', { name: 'Ocultar' })).toBeVisible();
    await expect(page.locator('button:has-text("Ajustes")')).toBeVisible();
  });

  test('nav bar visible con Place ID y Job ID', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Nav bar has Place ID and Job ID inputs
    await expect(page.locator('label:has-text("Place ID")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('label:has-text("Job ID")')).toBeVisible();
    await expect(page.locator('button:has-text("Servers")')).toBeVisible();
    await expect(page.locator('button:has-text("Join Server")')).toBeVisible();
  });

  test('action bar visible con botones agrupados', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Action bar: left group (management) — use .first() to avoid matching "Agregar Cuenta" in empty state
    await expect(page.locator('button:has-text("Agregar")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Eliminar")')).toBeVisible();
    // Right group (contextual)
    await expect(page.locator('button:has-text("Abrir App")')).toBeVisible();
    await expect(page.locator('button:has-text("Control")')).toBeVisible();
    await expect(page.locator('button:has-text("Follow")')).toBeVisible();
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

    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('window.api') &&
        !err.includes('api is undefined') &&
        !err.includes('Cannot read properties of undefined') &&
        !err.includes('api.settings') &&
        !err.includes('api.account') &&
        !err.includes('api.theme') &&
        !err.includes('api.language')
    );

    expect(criticalErrors).toEqual([]);
  });
});
